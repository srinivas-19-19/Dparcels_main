import { z } from 'zod';

export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['RIDER_QR', 'CASH']).default('RIDER_QR'),
    utrNumber: z.string().trim().max(100).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
  }),
});

export const orderPaymentParamsSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
});
