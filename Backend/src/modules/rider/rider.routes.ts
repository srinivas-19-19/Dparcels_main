import { Router } from 'express';
import { validateRequest } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { uploadQrMemory } from '../../middleware/upload';
import { availabilitySchema, updateRiderQrSchema } from './rider.schema';
import { 
  getRiderProfileController,
  toggleAvailabilityController, 
  updateRiderQrController, 
  uploadRiderQrController,
  getRiderOrdersController,
  getRiderStatsController
} from './rider.controller';

const router = Router();

router.use(authenticate);

// Riders only
router.get('/me', requireRole(['RIDER']), getRiderProfileController);
router.get('/orders', requireRole(['RIDER']), getRiderOrdersController);
router.get('/stats', requireRole(['RIDER']), getRiderStatsController);
router.patch('/availability', requireRole(['RIDER']), validateRequest(availabilitySchema), toggleAvailabilityController);
router.patch('/qr', requireRole(['RIDER']), validateRequest(updateRiderQrSchema), updateRiderQrController);
router.post('/qr-upload', requireRole(['RIDER']), uploadQrMemory.single('qrImage'), uploadRiderQrController);

export default router;
