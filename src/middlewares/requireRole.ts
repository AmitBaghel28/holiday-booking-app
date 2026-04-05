import { Response, NextFunction } from 'express';
import { AuthRequest, Role, Experience } from '../types';
import { AppError } from './errorHandler';
import db from '../db';

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHENTICATED', 'Please log in'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'FORBIDDEN', `Access denied. Required role: ${roles.join(' or ')}`)
      );
    }
    next();
  };
}

export function requireOwnerOrAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Please log in'));
  }

  const { id } = req.params;
  const experience = db
    .prepare('SELECT * FROM experiences WHERE id = ?')
    .get(id) as Experience | undefined;

  if (!experience) {
    return next(new AppError(404, 'NOT_FOUND', 'Experience not found'));
  }

  if (req.user.role === 'admin' || experience.created_by === req.user.userId) {
    (req as AuthRequest & { experience?: Experience }).experience = experience;
    return next();
  }

  next(new AppError(403, 'FORBIDDEN', 'You do not own this experience'));
}
