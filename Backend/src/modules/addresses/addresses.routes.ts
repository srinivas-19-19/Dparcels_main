import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { createAddressSchema, updateAddressSchema } from './addresses.schema';
import {
  getAddressesController,
  getAddressByIdController,
  createAddressController,
  updateAddressController,
  deleteAddressController,
  setDefaultAddressController,
} from './addresses.controller';

const router = Router();

router.use(authenticate);
router.use(requireRole(['CUSTOMER']));

router.get('/', getAddressesController);
router.post('/', validateRequest(createAddressSchema), createAddressController);
router.get('/:id', getAddressByIdController);
router.patch('/:id', validateRequest(updateAddressSchema), updateAddressController);
router.delete('/:id', deleteAddressController);
router.patch('/:id/default', setDefaultAddressController);

export default router;
