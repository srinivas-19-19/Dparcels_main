import { z } from 'zod';

export const updateCustomerProfileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1, 'Name cannot be empty').max(100, 'Name is too long').optional(),
      firstName: z.string().trim().min(1, 'First name cannot be empty').max(50, 'First name is too long').optional(),
      lastName: z.string().trim().max(50, 'Last name is too long').optional(),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number format. Must be 10 to 15 digits.')
        .nullable()
        .optional(),
      profileImage: z.string().nullable().optional(),
      preferredLanguage: z.enum(['en', 'te', 'ka', 'ta', 'hi']).optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
    })
    .strict(),
});

export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>['body'];
