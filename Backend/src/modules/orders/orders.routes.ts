import { Router } from 'express';
import { validateRequest } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { createOrderSchema } from './orders.schema';
import { 
  createOrderController, 
  getOrdersController, 
  getOrderByIdController,
  getAvailableOrdersController,
  acceptOrderController,
  updateOrderStatusController,
  submitReviewController
} from './orders.controller';

const router = Router();

router.use(authenticate);

// Customers
router.post('/', requireRole(['CUSTOMER']), validateRequest(createOrderSchema), createOrderController);
router.get('/my-orders', requireRole(['CUSTOMER']), getOrdersController);
router.get('/my-orders/:id', requireRole(['CUSTOMER']), getOrderByIdController);
router.post('/:id/rate', requireRole(['CUSTOMER']), submitReviewController);

// Riders
router.get('/available', requireRole(['RIDER']), getAvailableOrdersController);
router.post('/:id/accept', requireRole(['RIDER']), acceptOrderController);
router.post('/:id/status', requireRole(['RIDER']), updateOrderStatusController);

export default router;
