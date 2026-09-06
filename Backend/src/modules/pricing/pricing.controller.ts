import { Request, Response } from 'express';
import { PricingService } from './pricing.service';
import { sendSuccess, sendError } from '../../utils/response';

export const estimateController = async (req: Request, res: Response) => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng, serviceType } = req.body;
    
    const estimate = await PricingService.estimateDelivery(
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      serviceType
    );

    return sendSuccess(res, 200, estimate, 'Price estimate calculated successfully');
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Error calculating price estimate');
  }
};
