import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service';
import { sendSuccess, sendError } from '../../utils/response';

export const getNotificationsController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');
    
    const notifications = await NotificationsService.getNotifications(userId);
    return sendSuccess(res, 200, notifications);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch notifications');
  }
};

export const markAsReadController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const notificationId = req.params.id as string;
    if (!userId) return sendError(res, 401, 'Unauthorized');
    
    const notification = await NotificationsService.markAsRead(userId, notificationId);
    return sendSuccess(res, 200, notification);
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to mark notification as read');
  }
};
