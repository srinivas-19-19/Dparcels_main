import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { uploadBanner } from '../../middleware/upload';
import { 
  createBannerController,
  getActiveBannersController,
  toggleBannerController,
  deleteBannerController
} from './banners.controller';

const router = Router();

// Public / Customer
router.get('/', getActiveBannersController);

// Admins only
router.use(authenticate, requireRole(['ADMIN']));
router.post('/', uploadBanner.single('image'), createBannerController);
router.patch('/:id/toggle', toggleBannerController);
router.delete('/:id', deleteBannerController);

export default router;
