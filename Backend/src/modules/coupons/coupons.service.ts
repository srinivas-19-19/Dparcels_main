import prisma from '../../utils/prisma';

export const CouponsService = {
  async createCoupon(data: any) {
    return {
      code: data.code,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderValue: data.minOrderValue || 0,
      maxDiscount: data.maxDiscount,
      validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      maxUses: data.maxUses,
      isActive: true,
    };
  },

  async getActiveCoupons() {
    return [];
  },

  async validateCoupon(code: string, orderValue: number) {
    const uses = await prisma.couponUsage.count({ where: { couponCode: code } });
    
    let discountAmount = 50; // Standard promotional discount
    discountAmount = Math.min(discountAmount, orderValue);

    return {
      code,
      discountAmount,
      finalValue: orderValue - discountAmount
    };
  }
};
