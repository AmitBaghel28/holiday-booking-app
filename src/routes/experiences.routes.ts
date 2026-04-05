import { Router, Response, NextFunction } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { requireRole, requireOwnerOrAdmin } from '../middlewares/requireRole';
import { AuthRequest } from '../types';
import { createExperienceSchema, listExperiencesSchema } from '../validators/experience.validator';
import * as experiencesService from '../services/experiences.service';
import { AppError } from '../middlewares/errorHandler';
import { ZodError } from 'zod';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole('host', 'admin'),
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const input = createExperienceSchema.parse(req.body);
      const experience = experiencesService.createExperience(input, req.user!.userId);
      res.status(201).json(experience);
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', err.errors));
      }
      next(err);
    }
  }
);

router.get('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = listExperiencesSchema.parse(req.query);
    const result = experiencesService.listPublishedExperiences(query);
    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters', err.errors));
    }
    next(err);
  }
});

router.patch(
  '/:id/publish',
  requireAuth,
  requireOwnerOrAdmin,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const experience = experiencesService.publishExperience(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );
      res.json(experience);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id/block',
  requireAuth,
  requireRole('admin'),
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const experience = experiencesService.blockExperience(req.params.id);
      res.json(experience);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
