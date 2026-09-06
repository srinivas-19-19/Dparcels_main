import { Router } from 'express';
import { validateRequest } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { createTicketSchema, addMessageSchema } from './support.schema';
import { 
  createTicketController,
  getTicketsController,
  getTicketByIdController,
  addMessageController
} from './support.controller';

const router = Router();

router.use(authenticate);

// Customers & Admins can access (Service layer handles role logic)
router.post('/', validateRequest(createTicketSchema), createTicketController);
router.get('/', getTicketsController);
router.get('/:id', getTicketByIdController);
router.post('/:id/message', validateRequest(addMessageSchema), addMessageController);

export default router;
