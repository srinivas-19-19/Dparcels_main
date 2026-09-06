import { Router } from 'express';
import { validateRequest } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { availabilitySchema } from './rider.schema';
import { toggleAvailabilityController } from './rider.controller';

const router = Router();

router.use(authenticate);

// Riders only
router.patch('/availability', requireRole(['RIDER']), validateRequest(availabilitySchema), toggleAvailabilityController);

export default router;
