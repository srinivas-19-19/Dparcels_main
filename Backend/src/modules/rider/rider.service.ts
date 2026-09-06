import prisma from '../../utils/prisma';

export const RiderService = {
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
};
