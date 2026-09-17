import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { sendSuccess, sendError } from '../../utils/response';

export const getOrderPaymentQrController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const orderId = String(req.params.orderId);

    if (!userId || !role) {
      return sendError(res, 401, 'Unauthorized');
    }

    const data = await PaymentsService.getOrderPaymentQr(userId, role, orderId);
    return sendSuccess(res, 200, data, 'Payment and rider QR details retrieved successfully');
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 403 : error.message.includes('not found') ? 404 : 400;
    return sendError(res, status, error.message || 'Failed to fetch payment QR details');
  }
};

export const confirmManualPaymentController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const orderId = String(req.params.orderId);
    const { paymentMethod, utrNumber, notes } = req.body;

    if (!userId || !role) {
      return sendError(res, 401, 'Unauthorized');
    }

    if (role !== 'RIDER' && role !== 'ADMIN') {
      return sendError(res, 403, 'Forbidden: Only assigned riders can confirm payment collection');
    }

    const payment = await PaymentsService.confirmManualPayment(userId, orderId, {
      paymentMethod,
      utrNumber,
      notes,
    });

    return sendSuccess(res, 200, payment, 'Payment marked as confirmed by rider');
  } catch (error: any) {
    const status = error.message.includes('Unauthorized')
      ? 403
      : error.message.includes('not found')
      ? 404
      : 400;
    return sendError(res, status, error.message || 'Failed to confirm payment');
  }
};

export const getPaymentByOrderIdController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const orderId = String(req.params.orderId);

    if (!userId || !role) {
      return sendError(res, 401, 'Unauthorized');
    }

    const payment = await PaymentsService.getPaymentByOrderId(userId, role, orderId);
    return sendSuccess(res, 200, payment, 'Payment record retrieved');
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 403 : error.message.includes('not found') ? 404 : 400;
    return sendError(res, status, error.message || 'Failed to fetch payment');
  }
};
