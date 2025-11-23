import dotenv from "dotenv";

import { ethers } from "ethers";
import { PrismaClient } from "@prisma/client"; // tu instancia de Prisma

dotenv.config();

// 🔹 Inicializar conexión con la red Polygon (usando Infura o Alchemy)
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

// 🔹 Dirección y ABI del contrato de USDT en Polygon
const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint amount)"
];

/**
 * @desc Crear una dirección de pago para una orden
 * @route POST /api/payments/create
 * @access Private (usuario autenticado)
 */
export const createCryptoPayment = async (req, res) => {
  try {
    const { orderId, amountUSDT } = req.body;

    if (!orderId || !amountUSDT) {
      return res.status(400).json({ message: "Faltan datos del pago." });
    }

    // 🔹 Generar una wallet temporal (para recibir el pago)
    const wallet = ethers.Wallet.createRandom();
    const receivingAddress = wallet.address;

    // ⚠️ IMPORTANTE: guarda la privateKey cifrada o en un vault seguro si planeas usarla después
    // Aquí solo almacenamos la dirección
    await PrismaClient.cryptoPayment.create({
      data: {
        orderId,
        address: receivingAddress,
        amount: amountUSDT,
        status: "PENDING"
      }
    });

    res.status(201).json({
      message: "Dirección de pago generada correctamente.",
      address: receivingAddress,
      network: "Polygon",
      token: "USDT",
      amount: amountUSDT
    });
  } catch (error) {
    console.error("Error al crear pago cripto:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * @desc Consultar el estado de un pago
 * @route GET /api/payments/status/:orderId
 */
export const getCryptoPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await PrismaClient.cryptoPayment.findUnique({ where: { orderId } });

    if (!payment) {
      return res.status(404).json({ message: "Pago no encontrado." });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error al consultar pago:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
