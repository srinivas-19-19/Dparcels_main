import { z } from 'zod';

export const createAddressSchema = z.object({
  body: z.object({
    label: z.string().trim().min(1, 'Label is required').max(50, 'Label too long'),
    streetAddress: z.string().trim().min(3, 'Street address is required').max(255, 'Street address too long'),
    city: z.string().trim().min(2, 'City is required').max(100),
    state: z.string().trim().min(2, 'State is required').max(100),
    postalCode: z.string().trim().max(20).optional().default(''),
    country: z.string().trim().default('India'),
    latitude: z.coerce.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
    longitude: z.coerce.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
    providerPlaceId: z.string().optional().nullable(),
    isDefault: z.boolean().optional().default(false),
  }),
});

export const updateAddressSchema = z.object({
  body: z.object({
    label: z.string().trim().min(1).max(50).optional(),
    streetAddress: z.string().trim().min(3).max(255).optional(),
    city: z.string().trim().min(2).max(100).optional(),
    state: z.string().trim().min(2).max(100).optional(),
    postalCode: z.string().trim().min(3).max(20).optional(),
    country: z.string().trim().optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    providerPlaceId: z.string().optional().nullable(),
    isDefault: z.boolean().optional(),
  }),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>['body'];
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>['body'];
