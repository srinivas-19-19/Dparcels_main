import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { confirmPaymentSchema } from './payments.schema';
import {
  getOrderPaymentQrController,
  confirmManualPaymentController,
  getPaymentByOrderIdController,
} from './payments.controller';

const router = Router();

router.use(authenticate);

// Get rider payment QR and UPI info for an order (Customer & Rider)
router.get('/order/:orderId/qr', getOrderPaymentQrController);

// Rider manually confirms payment collection (RIDER only)
router.post(
  '/order/:orderId/confirm',
  validateRequest(confirmPaymentSchema),
  confirmManualPaymentController
);

// Get raw payment details for an order
router.get('/order/:orderId', getPaymentByOrderIdController);

export default router;
