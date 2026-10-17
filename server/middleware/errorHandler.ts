import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { config } from '../config/index.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err instanceof AppError ? err.statusCode : (err.status || 500);
  const message = err.message || 'An unexpected internal error occurred';
  const code = err instanceof AppError ? err.code : 'INTERNAL_SERVER_ERROR';

  if (statusCode >= 500 && config.nodeEnv !== 'test') {
    console.error(`[Error] ${req.method} ${req.url}:`, err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {})
  });
}
