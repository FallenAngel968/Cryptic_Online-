// testRpcConnection.js
import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";

async function main() {
  try {
    const rpcUrl = process.env.POLYGON_RPC_URL;
    const wssUrl = process.env.POLYGON_WSS_URL;

    if (!rpcUrl) throw new Error("Falta POLYGON_RPC_URL en tu archivo .env");

    console.log("🔌 Probando conexión HTTP con Polygon...");
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const blockNumber = await provider.getBlockNumber();
    console.log("✅ Conexión HTTP exitosa. Bloque actual:", blockNumber);

    if (wssUrl) {
      console.log("🌐 Probando conexión WebSocket...");
      const wsProvider = new ethers.WebSocketProvider(wssUrl);
      wsProvider.on("block", (num) => {
        console.log("📦 Nuevo bloque detectado vía WebSocket:", num);
        wsProvider.destroy();
        process.exit(0);
      });
    } else {
      console.log("⚠️ No tienes configurado POLYGON_WSS_URL, solo HTTP.");
    }

  } catch (err) {
    console.error("❌ Error al conectar:", err.message);
  }
}

main();
