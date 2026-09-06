import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { 
  getNotificationsController,
  markAsReadController
} from './notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/', getNotificationsController);
router.patch('/:id/read', markAsReadController);

export default router;
