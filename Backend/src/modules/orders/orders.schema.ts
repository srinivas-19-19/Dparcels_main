import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    idempotencyKey: z.string().min(1, 'Idempotency key is required'),
    pickupAddress: z.string().min(1, 'Pickup address is required'),
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    dropAddress: z.string().min(1).optional(),
    dropoffAddress: z.string().min(1).optional(),
    dropLat: z.number().min(-90).max(90).optional(),
    dropoffLat: z.number().min(-90).max(90).optional(),
    dropLng: z.number().min(-180).max(180).optional(),
    dropoffLng: z.number().min(-180).max(180).optional(),
    totalAmount: z.number().optional(),
    distanceKm: z.number().optional(),
    serviceType: z.string().min(1).default('STANDARD'),
    packageCategory: z.string().optional(),
    storeName: z.string().optional(),
    items: z.union([z.array(z.string()), z.string()]).optional(),
    instructions: z.string().optional(),
  }).refine((data) => data.dropAddress || data.dropoffAddress, {
    message: 'Drop address is required',
    path: ['dropAddress'],
  }),
});

export const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string().max(300).optional(),
  }),
});


