import { z } from 'zod';

export const bookingSchema = z.object({
  seats: z.number().int().min(1, 'seats must be at least 1'),
});

export type BookingInput = z.infer<typeof bookingSchema>;
