import { Request, Response } from 'express';
import { CustomersService, CustomerServiceError } from './customers.service';
import { StorageError } from '../../services/storage/supabaseStorage.service';
import { sendSuccess, sendError } from '../../utils/response';

export const getMyProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, 'Unauthorized');
    }

    const profile = await CustomersService.getProfile(userId);
    return sendSuccess(res, 200, profile);
  } catch (error: any) {
    const status = error instanceof CustomerServiceError ? error.statusCode : 500;
    return sendError(res, status, error.message || 'Error fetching profile');
  }
};

export const updateMyProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, 'Unauthorized');
    }

    const profile = await CustomersService.updateProfile(userId, req.body);
    return sendSuccess(res, 200, profile, 'Profile updated successfully');
  } catch (error: any) {
    const status = error instanceof CustomerServiceError ? error.statusCode : 500;
    return sendError(res, status, error.message || 'Error updating profile');
  }
};

export const uploadAvatarController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, 'Unauthorized');
    }

    const file = (req as any).file;
    if (!file || !file.buffer) {
      return sendError(res, 400, 'Image file is required');
    }

    const profile = await CustomersService.uploadAndSetAvatar(
      userId,
      file.buffer,
      file.mimetype
    );

    return sendSuccess(res, 200, profile, 'Avatar updated successfully');
  } catch (error: any) {
    const status =
      error instanceof CustomerServiceError || error instanceof StorageError
        ? error.statusCode
        : 500;
    return sendError(res, status, error.message || 'Failed to upload avatar');
  }
};

export const deleteAvatarController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, 'Unauthorized');
    }

    const profile = await CustomersService.deleteAvatar(userId);
    return sendSuccess(res, 200, profile, 'Avatar deleted successfully');
  } catch (error: any) {
    const status = error instanceof CustomerServiceError ? error.statusCode : 500;
    return sendError(res, status, error.message || 'Failed to delete avatar');
  }
};

export const getHomeDashboardController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, 'Unauthorized');
    }

    const dashboard = await CustomersService.getHomeDashboard(userId);
    return sendSuccess(res, 200, dashboard);
  } catch (error: any) {
    const status = error instanceof CustomerServiceError ? error.statusCode : 500;
    return sendError(res, status, error.message || 'Error fetching home dashboard');
  }
};
