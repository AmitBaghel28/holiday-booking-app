import { Router, Request, Response, NextFunction } from 'express';
import { signupSchema, loginSchema } from '../validators/auth.validator';
import * as authService from '../services/auth.service';
import { AppError } from '../middlewares/errorHandler';
import { ZodError } from 'zod';

const router = Router();

router.post('/signup', (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = signupSchema.parse(req.body);
    const result = authService.signup(input);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', err.errors));
    }
    next(err);
  }
});

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = authService.login(input);
    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', err.errors));;
    }
    next(err);
  }
});

export default router;
