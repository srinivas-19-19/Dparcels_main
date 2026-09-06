import { Router } from 'express';
import { validateRequest } from '../../middleware/validate';
import { estimateSchema } from './pricing.schema';
import { estimateController } from './pricing.controller';

const router = Router();

// Endpoint doesn't strictly need auth if we want public estimations on a landing page,
// but can be protected if required.
router.post('/estimate', validateRequest(estimateSchema), estimateController);

export default router;
