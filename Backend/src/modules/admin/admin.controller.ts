import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { sendSuccess, sendError } from '../../utils/response';

export const getDashboardStatsController = async (req: Request, res: Response) => {
  try {
    const stats = await AdminService.getDashboardStats();
    return sendSuccess(res, 200, stats);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch dashboard stats');
  }
};

export const getPendingRidersController = async (req: Request, res: Response) => {
  try {
    const riders = await AdminService.getPendingRiders();
    return sendSuccess(res, 200, riders);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch pending riders');
  }
};

export const approveRiderController = async (req: Request, res: Response) => {
  try {
    const riderProfileId = req.params.id as string;
    const rider = await AdminService.approveRider(riderProfileId);
    return sendSuccess(res, 200, rider, 'Rider approved successfully');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to approve rider');
  }
};

export const getAllOrdersController = async (req: Request, res: Response) => {
  try {
    const orders = await AdminService.getAllOrders();
    return sendSuccess(res, 200, orders);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch orders');
  }
};

export const getAllCustomersController = async (req: Request, res: Response) => {
  try {
    const customers = await AdminService.getAllCustomers();
    return sendSuccess(res, 200, customers);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch customers');
  }
};

export const getAllRidersController = async (req: Request, res: Response) => {
  try {
    const riders = await AdminService.getAllRiders();
    return sendSuccess(res, 200, riders);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch riders');
  }
};

export const getAllNotificationsController = async (req: Request, res: Response) => {
  try {
    const notifications = await AdminService.getAllNotifications();
    return sendSuccess(res, 200, notifications);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch notifications');
  }
};

export const broadcastNotificationController = async (req: Request, res: Response) => {
  try {
    const { title, message, targetRole } = req.body;
    const result = await AdminService.broadcastNotification(title, message, targetRole);
    return sendSuccess(res, 200, result, 'Broadcast sent');
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to broadcast');
  }
};

export const getAllPaymentsController = async (req: Request, res: Response) => {
  try {
    const payments = await AdminService.getAllPayments();
    return sendSuccess(res, 200, payments);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch payments');
  }
};

export const getBannersController = async (req: Request, res: Response) => {
  try {
    const banners = await AdminService.getAllBanners();
    return sendSuccess(res, 200, banners);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch banners');
  }
};

export const createBannerController = async (req: Request, res: Response) => {
  try {
    const banner = await AdminService.createBanner(req.body);
    return sendSuccess(res, 201, banner, 'Banner created');
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to create banner');
  }
};

export const deleteBannerController = async (req: Request, res: Response) => {
  try {
    const bannerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await AdminService.deleteBanner(bannerId);
    return sendSuccess(res, 200, null, 'Banner deleted');
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to delete banner');
  }
};
