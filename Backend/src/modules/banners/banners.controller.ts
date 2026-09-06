import { Request, Response } from 'express';
import { BannersService } from './banners.service';
import { sendSuccess, sendError } from '../../utils/response';
import { env } from '../../config/env';

export const createBannerController = async (req: Request, res: Response) => {
  try {
    if (!(req as any).file) {
      return sendError(res, 400, 'Image file is required');
    }
    
    // Construct the public URL for the image
    const imageUrl = `/uploads/banners/${(req as any).file.filename}`;
    const { title, linkUrl } = req.body;

    const banner = await BannersService.createBanner(imageUrl, title, linkUrl);
    return sendSuccess(res, 201, banner, 'Banner uploaded successfully');
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to upload banner');
  }
};

export const getActiveBannersController = async (req: Request, res: Response) => {
  try {
    const banners = await BannersService.getActiveBanners();
    
    // Prepend host URL so frontend gets absolute path
    const host = process.env.HOST_URL || `http://localhost:${env.PORT}`;
    const mapped = banners.map((b: any) => ({
      ...b,
      imageUrl: `${host}${b.imageUrl}`
    }));

    return sendSuccess(res, 200, mapped);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch banners');
  }
};

export const toggleBannerController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;
    const banner = await BannersService.toggleBanner(id, isActive);
    return sendSuccess(res, 200, banner, 'Banner updated successfully');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to update banner');
  }
};

export const deleteBannerController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await BannersService.deleteBanner(id);
    return sendSuccess(res, 200, null, 'Banner deleted successfully');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to delete banner');
  }
};
