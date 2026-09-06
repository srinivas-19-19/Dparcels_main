import prisma from '../../utils/prisma';

export const BannersService = {
  async createBanner(imageUrl: string, title?: string, linkUrl?: string) {
    return prisma.banner.create({
      data: {
        imageUrl,
        title,
        linkUrl,
        isActive: true,
      }
    });
  },

  async getActiveBanners() {
    return prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  },

  async toggleBanner(id: string, isActive: boolean) {
    return prisma.banner.update({
      where: { id },
      data: { isActive }
    });
  },

  async deleteBanner(id: string) {
    // Note: To be fully robust, we would also delete the file from the disk here using fs.unlink
    return prisma.banner.delete({
      where: { id }
    });
  }
};
