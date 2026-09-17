import prisma from '../../utils/prisma';
import supabaseStorageService from '../../services/storage/supabaseStorage.service';

export const RiderService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { riderProfile: true },
    });

    if (!user || !user.riderProfile) {
      throw new Error('Rider profile not found');
    }

    return {
      ...user.riderProfile,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  },

  async toggleAvailability(userId: string, isOnline: boolean) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { riderProfile: true },
    });

    if (!user || !user.riderProfile) {
      throw new Error('Rider profile not found');
    }

    if (!user.riderProfile.isApproved) {
      throw new Error('Rider account is pending admin approval');
    }

    const updatedProfile = await prisma.riderProfile.update({
      where: { id: user.riderProfile.id },
      data: { isOnline },
    });

    return updatedProfile;
  },

  async updateQr(userId: string, data: { paymentQrUrl?: string | null; upiId?: string | null }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { riderProfile: true },
    });

    if (!user || !user.riderProfile) {
      throw new Error('Rider profile not found');
    }

    const updateData: any = {};
    if (data.paymentQrUrl !== undefined) updateData.paymentQrUrl = data.paymentQrUrl;
    if (data.upiId !== undefined) updateData.upiId = data.upiId;

    const updatedProfile = await prisma.riderProfile.update({
      where: { id: user.riderProfile.id },
      data: updateData,
    });

    return updatedProfile;
  },

  async uploadAndSetQr(userId: string, buffer: Buffer, mimeType: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { riderProfile: true },
    });

    if (!user || !user.riderProfile) {
      throw new Error('Rider profile not found');
    }

    const oldQrUrl = user.riderProfile.paymentQrUrl;

    // 1. Upload to Supabase Storage
    const uploadResult = await supabaseStorageService.uploadRiderQr(userId, buffer, mimeType);

    // 2. Update rider profile in DB
    let updatedProfile: any;
    try {
      updatedProfile = await prisma.riderProfile.update({
        where: { id: user.riderProfile.id },
        data: { paymentQrUrl: uploadResult.publicUrl },
      });
    } catch (dbErr: any) {
      // Rollback newly uploaded file
      await supabaseStorageService.deleteRiderQr(uploadResult.path).catch(() => {});
      throw new Error('Failed to save payment QR URL to database');
    }

    // 3. Delete previous QR file if different
    if (oldQrUrl && oldQrUrl !== uploadResult.publicUrl) {
      supabaseStorageService.deleteRiderQr(oldQrUrl).catch(() => {});
    }

    return updatedProfile;
  },
};

export default RiderService;
