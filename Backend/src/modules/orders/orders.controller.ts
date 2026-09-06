import { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { sendSuccess, sendError } from '../../utils/response';

export const createOrderController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');
    
    const order = await OrdersService.createOrder(userId, req.body);
    return sendSuccess(res, 201, order, 'Order created successfully');
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to create order');
  }
};

export const getOrdersController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');
    
    const orders = await OrdersService.getCustomerOrders(userId);
    return sendSuccess(res, 200, orders);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch orders');
  }
};

export const getOrderByIdController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const id = req.params.id as string;
    if (!userId) return sendError(res, 401, 'Unauthorized');
    
    const order = await OrdersService.getOrderById(userId, id);
    return sendSuccess(res, 200, order);
  } catch (error: any) {
    return sendError(res, 404, error.message || 'Failed to fetch order');
  }
};

export const getAvailableOrdersController = async (req: Request, res: Response) => {
  try {
    const orders = await OrdersService.getAvailableOrders();
    return sendSuccess(res, 200, orders);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch available orders');
  }
};

export const acceptOrderController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const orderId = req.params.id as string;
    if (!userId) return sendError(res, 401, 'Unauthorized');
    
    const order = await OrdersService.acceptOrder(userId, orderId);
    
    // Broadcast via socket to customer that a rider has accepted
    try {
      const { getIO } = require('../../utils/socket');
      getIO().to(`order_${orderId}`).emit('order_status_update', { status: 'RIDER_ASSIGNED', timestamp: new Date() });
    } catch (e) {
       console.log('Socket broadcast failed', e);
    }

    return sendSuccess(res, 200, order, 'Order accepted successfully');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to accept order');
  }
};

export const updateOrderStatusController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const orderId = req.params.id as string;
    const { status } = req.body;
    if (!userId) return sendError(res, 401, 'Unauthorized');
    
    const order = await OrdersService.updateOrderStatus(userId, orderId, status);
    
    // Broadcast via socket
    try {
      const { getIO } = require('../../utils/socket');
      getIO().to(`order_${orderId}`).emit('order_status_update', { status, timestamp: new Date() });
    } catch (e) {
       console.log('Socket broadcast failed', e);
    }

    return sendSuccess(res, 200, order, 'Order status updated');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to update order status');
  }
};

export const submitReviewController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const customerId = req.user!.userId;
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return sendError(res, 400, 'Rating must be between 1 and 5');
    }

    const review = await OrdersService.submitReview(id, customerId, rating, feedback);
    return sendSuccess(res, 201, review, 'Review submitted successfully');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to submit review');
  }
};
