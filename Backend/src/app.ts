import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './modules/auth/auth.routes';
import pricingRoutes from './modules/pricing/pricing.routes';
import orderRoutes from './modules/orders/orders.routes';
import riderRoutes from './modules/rider/rider.routes';
import adminRoutes from './modules/admin/admin.routes';
import supportRoutes from './modules/support/support.routes';
import couponsRoutes from './modules/coupons/coupons.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import bannersRoutes from './modules/banners/banners.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check Endpoint
app.get('/health', async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'DParcels Backend API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/rider', riderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/coupons', couponsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/banners', bannersRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal Server Error',
    },
  });
});

export default app;
