import { z } from 'zod';

export const availabilitySchema = z.object({
  body: z.object({
    isOnline: z.boolean(),
  }),
});
