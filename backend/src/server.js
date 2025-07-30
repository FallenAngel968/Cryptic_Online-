import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import productRoutes from './routes/product.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// IMPORTANTE: esto debe ir _antes_ de cualquier middleware de 404
app.use('/api/payments', paymentRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/user', userRoutes);
app.use('/api', productRoutes);
app.use('/api', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
