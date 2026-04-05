import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public message: string,
    public details?: unknown[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function buildError(code: string, message: string, details?: unknown[]): { error: ApiError } {
  return { error: { code, message, details: details ?? [] } };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(buildError(err.code, err.message, err.details));
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json(buildError('INTERNAL_ERROR', 'An unexpected error occurred'));
}
