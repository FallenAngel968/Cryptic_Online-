import express from 'express';
import multer from 'multer';
import {
    createProduct,
    deleteProduct,
    getAllProducts,
    getProductById,
    getProductsByCategory,
    getProductsWithLowStock,
    updateProduct,
    updateStock
} from '../controllers/admin.product.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// CRUD Productos - Solo Administradores
router.get('/products', authenticateToken, requireAdmin, getAllProducts);
router.get('/products/:id', authenticateToken, requireAdmin, getProductById);
router.post('/products', authenticateToken, requireAdmin, upload.single('image'), createProduct);
router.put('/products/:id', authenticateToken, requireAdmin, upload.single('image'), updateProduct);
router.delete('/products/:id', authenticateToken, requireAdmin, deleteProduct);

// Gestión de Stock
router.patch('/products/:id/stock', authenticateToken, requireAdmin, updateStock);
router.get('/products/stock/low', authenticateToken, requireAdmin, getProductsWithLowStock);

// Categorías
router.get('/products/category/:category', authenticateToken, requireAdmin, getProductsByCategory);

console.log('✅ Rutas de administración registradas:');
console.log('  - GET /api/admin/products');
console.log('  - POST /api/admin/products');
console.log('  - PUT /api/admin/products/:id');
console.log('  - DELETE /api/admin/products/:id');
console.log('  - PATCH /api/admin/products/:id/stock');
console.log('  - GET /api/admin/products/stock/low');

export default router;