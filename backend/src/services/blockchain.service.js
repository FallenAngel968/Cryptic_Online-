// services/blockchain.service.js
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
const usdtAbi = JSON.parse(fs.readFileSync(new URL("../abis/usdtAbi.json", import.meta.url)));

import { ethers } from "ethers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const HTTP_PROVIDER = process.env.POLYGON_RPC_URL;
const WSS_PROVIDER = process.env.POLYGON_WSS_URL;
const USDT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS;
const CONFIRMATIONS_REQUIRED = parseInt(process.env.CONFIRMATIONS_REQUIRED || "2", 10);
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "15000", 10);

// ERC20 Transfer event ABI minimal
const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)"
];

let httpProvider = new ethers.JsonRpcProvider(HTTP_PROVIDER);
let wsProvider;
try {
  if (WSS_PROVIDER) wsProvider = new ethers.WebSocketProvider(WSS_PROVIDER);
} catch (e) {
  console.warn("No WebSocket provider available:", e.message);
  wsProvider = null;
}
// Crear contrato HTTP del token USDT para leer datos básicos (como decimals)

let httpContract;
if (HTTP_PROVIDER && USDT_ADDRESS) {
  httpContract = new ethers.Contract(USDT_ADDRESS, usdtAbi, httpProvider);
  console.log("✅ Contrato USDT inicializado correctamente");
} else {
  console.error("❌ No se pudo inicializar httpContract (faltan provider o address)");
}


// Contract instances
const tokenContract = new ethers.Contract(USDT_ADDRESS, usdtAbi, httpProvider);

//&const httpContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, httpProvider);
const wsContract = wsProvider ? new ethers.Contract(USDT_ADDRESS, usdtAbi, wsProvider) : null;

let tokenDecimalsCache = null;

async function getTokenDecimals() {
  if (tokenDecimalsCache !== null) return tokenDecimalsCache;
  try {
    const d = await httpContract.decimals();
    tokenDecimalsCache = Number(d);
    console.log("USDT decimals:", tokenDecimalsCache);
    return tokenDecimalsCache;
  } catch (err) {
    console.error("Error obteniendo decimals del token:", err);
    // por seguridad asumir 6 (USDT suele usar 6 en varias redes) — pero preferible obtenerlo
    tokenDecimalsCache = 6;
    return tokenDecimalsCache;
  }
}

/**
 * Marca pago como confirmado en DB
 */
async function markPaymentConfirmed(paymentId, txHash, amount, blockNumber) {
  try {
    await prisma.cryptoPayment.update({
      where: { id: paymentId },
      data: {
        status: "CONFIRMED",
        txHash,
        amount: Number(amount), // amount en unidades humanas (p. ej. 50.0)
        updatedAt: new Date()
      }
    });
    console.log(`Pago ${paymentId} confirmado (tx ${txHash})`);
  } catch (err) {
    console.error("Error actualizando DB al confirmar pago:", err);
  }
}

/**
 * Maneja una transferencia detectada por evento
 * - chequea si existe un registro pendiente con esa address y amount esperado
 * - espera confirmaciones requeridas
 */
async function handleTransferEvent(from, to, value, event) {
  try {
    const decimals = await getTokenDecimals();
    const valueHuman = Number(ethers.formatUnits(value, decimals)); // p. ej. 50.0

    // Buscar pagos pendientes con la dirección 'to'
    const pendingPayments = await prisma.cryptoPayment.findMany({
      where: {
        address: to.toLowerCase(),
        status: "PENDING"
      }
    });

    if (!pendingPayments || pendingPayments.length === 0) {
      // no es una dirección que tengamos registrada
      return;
    }

    // Para cada pago pendiente, comparar montos (aceptar pequeñas diferencias si quieres)
    for (const pay of pendingPayments) {
      // Si el monto recibido >= monto esperado, procede
      // Puedes afinar comparación (p. ej. tolerancia por decimales)
      if (valueHuman >= Number(pay.amount)) {
        const txHash = event.transactionHash;
        const blockNumber = event.blockNumber;

        // Esperar confirmaciones (usando polling del bloque actual)
        const targetBlock = blockNumber + CONFIRMATIONS_REQUIRED;
        console.log(`Detected tx ${txHash} to ${to} value ${valueHuman}. Waiting until block ${targetBlock} for ${CONFIRMATIONS_REQUIRED} confirmations.`);

        // Poll until block >= targetBlock
        let current = await httpProvider.getBlockNumber();
        while (current < targetBlock) {
          await new Promise((r) => setTimeout(r, 4000));
          current = await httpProvider.getBlockNumber();
        }

        // Finalmente marcar confirmado
        await markPaymentConfirmed(pay.id, txHash, valueHuman, blockNumber);
      }
    }
  } catch (err) {
    console.error("Error en handleTransferEvent:", err);
  }
}

/**
 * Inicia listeners por evento Transfer para todas las direcciones pendientes
 * Crea filtros individuales por "to" address para no procesar todo el contrato.
 */
async function setupEventListeners() {
  if (!wsContract) {
    console.warn("No hay contrato via WebSocket — usando polling (sin listeners en tiempo real).");
    return;
  }

  // Recuperar pagos pendientes y crear filtros
  const pendings = await prisma.cryptoPayment.findMany({
    where: { status: "PENDING" }
  });

  console.log(`Registrando listeners para ${pendings.length} direcciones pendientes.`);

  // Evitar duplicados: mantiene un set de direcciones registradas
  const registered = new Set();

  for (const p of pendings) {
    const addr = p.address.toLowerCase();
    if (registered.has(addr)) continue;
    registered.add(addr);

    // crear filtro: Transfer(undefined, to, uint256)
    const filter = wsContract.filters.Transfer(null, addr);
    wsContract.on(filter, (from, to, value, event) => {
      // event contiene transactionHash, blockNumber...
      handleTransferEvent(from, to, value, event);
    });

    console.log("Listener registrado para address:", addr);
  }

  // Escuchar nuevos pagos que se creen en DB si quieres (recomendado: emitir evento o re-ejecutar setup)
}

/**
 * Polling fallback:
 * Cada POLL_INTERVAL_MS busca txs recientes para nuestras direcciones pendientes
 * (usa getLogs con filter by topics para Transfer to these addresses)
 */
async function pollingLoop() {
  console.log("Iniciando polling loop cada", POLL_INTERVAL_MS, "ms");
  const decimals = await getTokenDecimals();

  while (true) {
    try {
      const pendings = await prisma.cryptoPayment.findMany({
        where: { status: "PENDING" }
      });

      if (pendings.length === 0) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }

      // construir filtros para getLogs: Transfer topic and to-addresses
      // topic0 = Transfer signature, topic2 = to address
      const transferTopic = ethers.id("Transfer(address,address,uint256)"); // topic0

      for (const p of pendings) {
        const toTopic = ethers.getAddress(p.address); // normalized
        // getLogs expects address topic as 32 bytes hex (zero padded)
        const topicTo = ethers.hexZeroPad(toTopic, 32);
        const filter = {
          address: USDT_ADDRESS,
          topics: [transferTopic, null, ethers.hexZeroPad(ethers.getAddress(p.address), 32)]
        };

        // buscar logs recientes (limit by last 5000 blocks? ajustar según necesidad)
        const nowBlock = await httpProvider.getBlockNumber();
        const fromBlock = Math.max(0, nowBlock - 5000);

        try {
          const logs = await httpProvider.getLogs({ ...filter, fromBlock, toBlock: nowBlock });
          for (const log of logs) {
            // parsear log con interfaz
            const parsed = httpContract.interface.parseLog(log);
            const from = parsed.args.from;
            const to = parsed.args.to;
            const value = parsed.args.value;
            const valueHuman = Number(ethers.formatUnits(value, decimals));
            if (valueHuman >= Number(p.amount)) {
              // esperar confirmaciones
              const txHash = log.transactionHash;
              const receipt = await httpProvider.getTransactionReceipt(txHash);
              const txBlock = receipt.blockNumber;
              const targetBlock = txBlock + CONFIRMATIONS_REQUIRED;
              let cur = await httpProvider.getBlockNumber();
              while (cur < targetBlock) {
                await new Promise((r) => setTimeout(r, 4000));
                cur = await httpProvider.getBlockNumber();
              }
              await markPaymentConfirmed(p.id, txHash, valueHuman, txBlock);
            }
          }
        } catch (err) {
          // algunos proveedores limitan getLogs; maneja errores suave
          console.error("Error en getLogs para address", p.address, err.message || err);
        }
      }
    } catch (err) {
      console.error("Error en pollingLoop:", err);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

/**
 * Inicializar servicio:
 * - levanta listeners (si websocket)
 * - inicia polling como fallback
 */
export async function startBlockchainService() {
  console.log("Iniciando Blockchain Service...");

  // intentar register listeners via websocket
  try {
    if (wsProvider && wsContract) {
      await setupEventListeners();

      // manejar reconexiones simples
      wsProvider._websocket?.on("close", async () => {
        console.warn("WebSocket cerrado — reintentando conectar en 5s.");
        setTimeout(() => {
          // Para simplicidad recargar proceso o re-instanciar provider (puedes mejorar esto)
          process.exit(1);
        }, 5000);
      });
    } else {
      console.warn("WebSocket no disponible, usando solo polling.");
    }
  } catch (err) {
    console.error("Error al registrar listeners:", err);
  }

  // iniciar polling siempre (actúa también como verificador y como fallback)
  pollingLoop().catch((e) => console.error("Polling stopped:", e));
}
