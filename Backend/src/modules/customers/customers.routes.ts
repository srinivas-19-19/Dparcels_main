import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { uploadAvatarMemory } from '../../middleware/upload';
import { updateCustomerProfileSchema } from './customers.schema';
import {
  getMyProfileController,
  updateMyProfileController,
  uploadAvatarController,
  deleteAvatarController,
  getHomeDashboardController,
} from './customers.controller';

const router = Router();

// All customer routes require authentication and CUSTOMER role
router.use(authenticate);
router.use(requireRole(['CUSTOMER']));

router.get('/home-dashboard', getHomeDashboardController);
router.get('/me', getMyProfileController);
router.patch('/me', validateRequest(updateCustomerProfileSchema), updateMyProfileController);
router.post('/me/avatar', uploadAvatarMemory.single('avatar'), uploadAvatarController);
router.delete('/me/avatar', deleteAvatarController);

export default router;
