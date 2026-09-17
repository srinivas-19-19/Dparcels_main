import { Request, Response } from 'express';
import { MapService } from '../../services/map.service';
import { sendSuccess, sendError } from '../../utils/response';

export const autocompleteController = async (req: Request, res: Response) => {
  try {
    const input = (req.query.input as string) || '';
    if (!input || input.trim().length < 2) {
      return sendSuccess(res, 200, []);
    }

    const suggestions = await MapService.getPlaceAutocomplete(input);
    return sendSuccess(res, 200, suggestions);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch suggestions');
  }
};

export const placeDetailsController = async (req: Request, res: Response) => {
  try {
    const placeId = (req.query.placeId as string) || '';
    if (!placeId) {
      return sendError(res, 400, 'placeId query parameter is required');
    }

    const details = await MapService.getPlaceDetails(placeId);
    return sendSuccess(res, 200, details);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch place details');
  }
};

export const geocodeController = async (req: Request, res: Response) => {
  try {
    const address = (req.query.address as string) || '';
    if (!address) {
      return sendError(res, 400, 'address query parameter is required');
    }

    const geocoded = await MapService.geocodeAddress(address);
    return sendSuccess(res, 200, geocoded);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to geocode address');
  }
};

export const reverseGeocodeController = async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return sendError(res, 400, 'Valid lat and lng query parameters are required');
    }

    const address = await MapService.reverseGeocode(lat, lng);
    return sendSuccess(res, 200, address);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to reverse geocode coordinates');
  }
};

export const distanceController = async (req: Request, res: Response) => {
  try {
    const originLat = parseFloat(req.query.originLat as string);
    const originLng = parseFloat(req.query.originLng as string);
    const destLat = parseFloat(req.query.destLat as string);
    const destLng = parseFloat(req.query.destLng as string);

    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      return sendError(
        res,
        400,
        'Valid originLat, originLng, destLat, and destLng query parameters are required'
      );
    }

    const distance = await MapService.calculateDistanceAndETA(
      originLat,
      originLng,
      destLat,
      destLng
    );
    return sendSuccess(res, 200, distance);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to calculate distance');
  }
};
