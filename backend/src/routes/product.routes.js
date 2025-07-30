import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Listar productos (público)
router.get('/products', getAllProducts);

// Obtener producto por id (público)
router.get('/products/:id', getProductById);

// Crear producto (solo admin)
router.post('/products', authenticateToken, isAdmin, createProduct);

// Actualizar producto (solo admin)
router.put('/products/:id', authenticateToken, isAdmin, updateProduct);

// Eliminar producto (solo admin)
router.delete('/products/:id', authenticateToken, isAdmin, deleteProduct);

export default router;
