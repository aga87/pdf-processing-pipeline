// middleware/globalErrorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../models';
import { logger } from '../logging';

/**
 * Global Express error handler.
 * Catches any errors thrown in the app and returns a structured JSON response.
 */
export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  let statusCode = 500;
  let errorMsg = 'Internal server error.';

  if (err instanceof HttpError) {
    statusCode = err.statusCode;
    errorMsg = err.message;
  } else if (err instanceof Error) {
    errorMsg = err.message;
  }

  logger.error('Global error handler caught:', { err, statusCode, errorMsg });

  res.status(statusCode).json({ error: errorMsg });
};
