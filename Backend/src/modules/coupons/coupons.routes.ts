import { Router } from 'express';
import { validateRequest } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { createCouponSchema, validateCouponSchema } from './coupons.schema';
import { 
  createCouponController,
  getActiveCouponsController,
  validateCouponController
} from './coupons.controller';

const router = Router();

router.use(authenticate);

// Customers
router.get('/active', getActiveCouponsController);
router.post('/validate', validateRequest(validateCouponSchema), validateCouponController);

// Admins only
router.post('/', requireRole(['ADMIN']), validateRequest(createCouponSchema), createCouponController);

export default router;
