import express from "express";
import { createCryptoPayment, getCryptoPaymentStatus } from "../controllers/cryptoPayments.controller.js";

const router = express.Router();

router.post("/create", createCryptoPayment);
router.get("/status/:orderId", getCryptoPaymentStatus);

export default router;
