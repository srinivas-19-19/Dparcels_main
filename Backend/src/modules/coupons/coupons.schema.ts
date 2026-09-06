import { z } from 'zod';

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    description: z.string().optional(),
    discountType: z.enum(['PERCENTAGE', 'FLAT']),
    discountValue: z.number().positive(),
    minOrderValue: z.number().nonnegative().optional(),
    maxDiscount: z.number().positive().optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    maxUses: z.number().int().positive().optional(),
  }),
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().toUpperCase(),
    orderValue: z.number().positive(),
  }),
});
