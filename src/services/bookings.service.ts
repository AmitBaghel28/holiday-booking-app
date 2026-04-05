import crypto from 'crypto';
import db from '../db';
import { Booking, Experience } from '../types';
import { BookingInput } from '../validators/booking.validator';
import { AppError } from '../middlewares/errorHandler';

export function createBooking(
  experienceId: string,
  userId: string,
  userRole: string,
  input: BookingInput
): Booking {
  if (userRole === 'host') {
    throw new AppError(403, 'FORBIDDEN', 'Hosts cannot book experiences');
  }

  const experience = db
    .prepare('SELECT * FROM experiences WHERE id = ?')
    .get(experienceId) as Experience | undefined;

  if (!experience) {
    throw new AppError(404, 'NOT_FOUND', 'Experience not found');
  }

  if (experience.status !== 'published') {
    throw new AppError(400, 'NOT_PUBLISHED', 'You can only book published experiences');
  }

  if (experience.created_by === userId) {
    throw new AppError(403, 'FORBIDDEN', 'You cannot book your own experience');
  }

  const duplicate = db
    .prepare(
      "SELECT id FROM bookings WHERE user_id = ? AND experience_id = ? AND status = 'confirmed'"
    )
    .get(userId, experienceId);

  if (duplicate) {
    throw new AppError(409, 'DUPLICATE_BOOKING', 'You already have an active booking for this experience');
  }

  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO bookings (id, experience_id, user_id, seats, status) VALUES (?, ?, ?, ?, 'confirmed')"
  ).run(id, experienceId, userId, input.seats);

  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as Booking;
}
