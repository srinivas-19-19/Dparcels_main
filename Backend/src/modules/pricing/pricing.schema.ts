import { z } from 'zod';

export const estimateSchema = z.object({
  body: z.object({
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    dropLat: z.number().min(-90).max(90),
    dropLng: z.number().min(-180).max(180),
    serviceType: z.enum(['STANDARD', 'EXPRESS']).default('STANDARD'),
  }),
});
