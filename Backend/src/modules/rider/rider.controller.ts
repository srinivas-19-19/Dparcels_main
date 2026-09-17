import { Request, Response } from 'express';
import { RiderService } from './rider.service';
import { sendSuccess, sendError } from '../../utils/response';

export const getRiderProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const profile = await RiderService.getProfile(userId);
    return sendSuccess(res, 200, profile, 'Rider profile fetched successfully');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to fetch rider profile');
  }
};

export const toggleAvailabilityController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const { isOnline } = req.body;
    
    const profile = await RiderService.toggleAvailability(userId, isOnline);
    return sendSuccess(res, 200, { isOnline: profile.isOnline }, 'Availability updated');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to update availability');
  }
};

export const updateRiderQrController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const { upiId, paymentQrUrl } = req.body;
    const profile = await RiderService.updateQr(userId, { upiId, paymentQrUrl });
    return sendSuccess(res, 200, profile, 'Rider payment QR details updated');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to update payment QR details');
  }
};

export const uploadRiderQrController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const file = (req as any).file;
    if (!file) {
      return sendError(res, 400, 'QR image file is required');
    }

    const profile = await RiderService.uploadAndSetQr(userId, file.buffer, file.mimetype);
    return sendSuccess(res, 200, profile, 'Rider payment QR uploaded successfully');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to upload payment QR');
  }
};
