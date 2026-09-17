import { Request, Response } from 'express';
import { AddressesService, AddressServiceError } from './addresses.service';
import { sendSuccess, sendError } from '../../utils/response';

export const getAddressesController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const addresses = await AddressesService.getAddresses(userId);
    return sendSuccess(res, 200, addresses);
  } catch (error: any) {
    const status = error instanceof AddressServiceError ? error.statusCode : 500;
    return sendError(res, status, error.message || 'Failed to fetch addresses');
  }
};

export const getAddressByIdController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const id = req.params.id as string;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const address = await AddressesService.getAddressById(userId, id);
    return sendSuccess(res, 200, address);
  } catch (error: any) {
    const status = error instanceof AddressServiceError ? error.statusCode : 500;
    return sendError(res, status, error.message || 'Failed to fetch address');
  }
};

export const createAddressController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const address = await AddressesService.createAddress(userId, req.body);
    return sendSuccess(res, 201, address, 'Address saved successfully');
  } catch (error: any) {
    const status = error instanceof AddressServiceError ? error.statusCode : 500;
    return sendError(res, status, error.message || 'Failed to save address');
  }
};

export const updateAddressController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const id = req.params.id as string;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const address = await AddressesService.updateAddress(userId, id, req.body);
    return sendSuccess(res, 200, address, 'Address updated successfully');
  } catch (error: any) {
    const status = error instanceof AddressServiceError ? error.statusCode : 500;
    return sendError(res, status, error.message || 'Failed to update address');
  }
};

export const deleteAddressController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const id = req.params.id as string;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const result = await AddressesService.deleteAddress(userId, id);
    return sendSuccess(res, 200, result, 'Address deleted successfully');
  } catch (error: any) {
    const status = error instanceof AddressServiceError ? error.statusCode : 500;
    return sendError(res, status, error.message || 'Failed to delete address');
  }
};

export const setDefaultAddressController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const id = req.params.id as string;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const address = await AddressesService.setDefaultAddress(userId, id);
    return sendSuccess(res, 200, address, 'Default address updated successfully');
  } catch (error: any) {
    const status = error instanceof AddressServiceError ? error.statusCode : 500;
    return sendError(res, status, error.message || 'Failed to set default address');
  }
};
