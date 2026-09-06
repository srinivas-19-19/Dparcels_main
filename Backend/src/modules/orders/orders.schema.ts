import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    idempotencyKey: z.string().min(1, 'Idempotency key is required'),
    pickupAddress: z.string().min(1),
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    dropAddress: z.string().min(1),
    dropLat: z.number().min(-90).max(90),
    dropLng: z.number().min(-180).max(180),
    serviceType: z.enum(['STANDARD', 'EXPRESS']).default('STANDARD'),
  }),
});
