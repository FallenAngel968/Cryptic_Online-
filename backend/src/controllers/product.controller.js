import prisma from '../prisma/db.js';

// Crear producto

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      imageUrl,
      userId,
      discount, // { percentage, startDate, endDate }
    } = req.body;

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price,
        imageUrl,
        userId,
        discounts: discount
          ? {
              create: {
                percentage: discount.percentage,
                startDate: new Date(discount.startDate),
                endDate: new Date(discount.endDate),
              },
            }
          : undefined,
      },
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// Listar todos los productos (público)
export const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        user: {
          select: {
            id: true,
            nombres: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('[ERROR getAllProducts]', error);
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
};

// Obtener producto por id (público)
export const getProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo producto' });
  }
};

// Actualizar producto (solo admin)
export const updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, price, imageUrl } = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: Number(price),
        imageUrl,
        userId: req.user.userId,
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error actualizando producto' });
  }
};

// Eliminar producto (solo admin)
export const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.product.delete({ where: { id } });

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error eliminando producto' });
  }
};
