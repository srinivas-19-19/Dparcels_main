import { Request, Response } from 'express';
import { RiderService } from './rider.service';
import { sendSuccess, sendError } from '../../utils/response';

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
