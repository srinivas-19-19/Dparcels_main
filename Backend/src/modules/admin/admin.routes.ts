import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { 
  getDashboardStatsController,
  getPendingRidersController,
  approveRiderController,
  getAllOrdersController,
  getAllCustomersController,
  getAllRidersController,
  getAllNotificationsController,
  broadcastNotificationController,
  getAllPaymentsController,
  getBannersController,
  createBannerController,
  deleteBannerController
} from './admin.controller';

const router = Router();

// Strict ADMIN only route
router.use(authenticate, requireRole(['ADMIN']));

router.get('/dashboard', getDashboardStatsController);
router.get('/orders', requireRole(['ADMIN']), getAllOrdersController);
router.get('/customers', requireRole(['ADMIN']), getAllCustomersController);
router.get('/riders', requireRole(['ADMIN']), getAllRidersController);

// Notifications
router.get('/notifications', requireRole(['ADMIN']), getAllNotificationsController);
router.post('/notifications/broadcast', requireRole(['ADMIN']), broadcastNotificationController);
router.get('/riders/pending', getPendingRidersController);
router.patch('/riders/:id/approve', approveRiderController);

// Payments
router.get('/payments', requireRole(['ADMIN']), getAllPaymentsController);

// Banners
router.get('/banners', getBannersController); // Public (for user app)
router.post('/banners', requireRole(['ADMIN']), createBannerController);
router.delete('/banners/:id', requireRole(['ADMIN']), deleteBannerController);

export default router;
