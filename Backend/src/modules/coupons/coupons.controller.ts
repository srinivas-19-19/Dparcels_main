import { Request, Response } from 'express';
import { CouponsService } from './coupons.service';
import { sendSuccess, sendError } from '../../utils/response';

export const createCouponController = async (req: Request, res: Response) => {
  try {
    const coupon = await CouponsService.createCoupon(req.body);
    return sendSuccess(res, 201, coupon, 'Coupon created successfully');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to create coupon');
  }
};

export const getActiveCouponsController = async (req: Request, res: Response) => {
  try {
    const coupons = await CouponsService.getActiveCoupons();
    return sendSuccess(res, 200, coupons);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch coupons');
  }
};

export const validateCouponController = async (req: Request, res: Response) => {
  try {
    const { code, orderValue } = req.body;
    const result = await CouponsService.validateCoupon(code, orderValue);
    return sendSuccess(res, 200, result, 'Coupon applied successfully');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Invalid coupon');
  }
};
