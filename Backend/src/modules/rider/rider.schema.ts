import { z } from 'zod';

export const availabilitySchema = z.object({
  body: z.object({
    isOnline: z.boolean(),
  }),
});

export const updateRiderProfileSchema = z.object({
  body: z.object({
    upiId: z.string().trim().max(100).optional().nullable(),
    paymentQrUrl: z.string().trim().url().optional().nullable(),
    vehicleType: z.string().trim().min(2).max(50).optional(),
    vehicleNumber: z.string().trim().min(3).max(50).optional(),
  }),
});

export const updateRiderQrSchema = z.object({
  body: z.object({
    upiId: z.string().trim().max(100).optional().nullable(),
    paymentQrUrl: z.string().trim().url().optional().nullable(),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['RIDER_QR', 'CASH']).default('RIDER_QR'),
    utrNumber: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});
