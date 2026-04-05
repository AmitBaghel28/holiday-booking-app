import { Router, Response, NextFunction } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { AuthRequest } from '../types';
import { bookingSchema } from '../validators/booking.validator';
import * as bookingsService from '../services/bookings.service';
import { AppError } from '../middlewares/errorHandler';
import { ZodError } from 'zod';

const router = Router({ mergeParams: true });

router.post('/', requireAuth, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = bookingSchema.parse(req.body);
    const booking = bookingsService.createBooking(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      input
    );
    res.status(201).json(booking);
  } catch (err) {
    if (err instanceof ZodError) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', err.errors));
    }
    next(err);
  }
});

export default router;
