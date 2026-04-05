import { z } from 'zod';

export const createExperienceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(2, 'Location is required'),
  price: z.number().int().min(0, 'Price must be a non-negative integer'),
  start_time: z.string().datetime({ message: 'start_time must be a valid ISO datetime' }),
});

export const listExperiencesSchema = z.object({
  location: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type ListExperiencesInput = z.infer<typeof listExperiencesSchema>;
