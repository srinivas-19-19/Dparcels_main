import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = (parsed as any).body;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Extract validation issues
        const formattedErrors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        
        return sendError(res, 400, error.issues[0]?.message || 'Validation failed', formattedErrors);
      }
      return next(error);
    }
  };
};
