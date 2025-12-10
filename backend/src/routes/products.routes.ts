import { PrismaClient } from '@prisma/client';
import express from 'express';
import multer from 'multer';
import { deleteImage, uploadImage } from '../firebase/uploadImage.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo permitidos
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG y WebP.'));
    }
  },
});

/**
 * POST /products - Crear un nuevo producto con imagen
 */
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    const file = req.file;

    // Validar datos requeridos
    if (!name || !description || !price || !stock) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: name, description, price, stock'
      });
    }

    if (!file) {
      return res.status(400).json({
        error: 'Se requiere una imagen del producto'
      });
    }

    // Subir imagen a Firebase Storage
    const imageUrl = await uploadImage(file);

    // Crear producto en la base de datos
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        imageUrl,
        userId: req.user?.userId || 1, // ID del usuario autenticado
      },
    });

    console.log('✅ Producto creado exitosamente:', product.id);
    
    res.status(201).json({
      message: 'Producto creado exitosamente',
      product,
    });

  } catch (error) {
    console.error('❌ Error creando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor al crear el producto'
    });
  }
});

/**
 * GET /products - Obtener lista de productos
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Construir filtros de búsqueda
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' as const } },
            { description: { contains: search as string, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Obtener productos con paginación
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              nombres: true,
              apellidoPaterno: true,
            },
          },
        },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });

  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener productos'
    });
  }
});

/**
 * GET /products/:id - Obtener un producto por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            nombres: true,
            apellidoPaterno: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    res.json({ product });

  } catch (error) {
    console.error('❌ Error obteniendo producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener el producto'
    });
  }
});

/**
 * PUT /products/:id - Actualizar un producto
 */
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock } = req.body;
    const file = req.file;

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (stock) updateData.stock = parseInt(stock);

    // Si hay nueva imagen, subir y actualizar URL
    if (file) {
      const newImageUrl = await uploadImage(file);
      updateData.imageUrl = newImageUrl;

      // Eliminar imagen anterior si existe
      if (existingProduct.imageUrl) {
        try {
          await deleteImage(existingProduct.imageUrl);
        } catch (error) {
          console.warn('⚠️ No se pudo eliminar la imagen anterior');
        }
      }
    }

    // Actualizar producto
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({
      message: 'Producto actualizado exitosamente',
      product: updatedProduct,
    });

  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor al actualizar el producto'
    });
  }
});

/**
 * DELETE /products/:id - Eliminar un producto
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener producto para eliminar imagen
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    // Eliminar producto de la base de datos
    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    // Eliminar imagen de Firebase Storage
    if (product.imageUrl) {
      try {
        await deleteImage(product.imageUrl);
      } catch (error) {
        console.warn('⚠️ No se pudo eliminar la imagen del producto');
      }
    }

    res.json({
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor al eliminar el producto'
    });
  }
});

console.log('✅ Rutas de productos registradas:');
console.log('  - POST /api/products (crear producto con imagen)');
console.log('  - GET /api/products (listar productos)');
console.log('  - GET /api/products/:id (obtener producto)');
console.log('  - PUT /api/products/:id (actualizar producto)');
console.log('  - DELETE /api/products/:id (eliminar producto)');

export default router;