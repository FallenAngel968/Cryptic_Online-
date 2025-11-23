import express from 'express';
import enviaService from '../services/envia.service.js';

const router = express.Router();

// Crear envío
router.post('/shipments', async (req, res) => {
  try {
    const shipment = await enviaService.createShipment(req.body);
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rastrear envío
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const tracking = await enviaService.trackShipment(req.params.trackingNumber);
    res.json(tracking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
