import { z } from 'zod';

export const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(5).max(255),
    message: z.string().min(10).optional(),
  }),
});

export const addMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1),
  }),
});
