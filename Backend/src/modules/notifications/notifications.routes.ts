import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { 
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
} from './notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/', getNotificationsController);
router.patch('/read-all', markAllAsReadController);
router.patch('/:id/read', markAsReadController);

export default router;
