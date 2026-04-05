import { Request } from 'express';

export type Role = 'admin' | 'host' | 'user';
export type ExperienceStatus = 'draft' | 'published' | 'blocked';
export type BookingStatus = 'confirmed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: string;
}

export interface Experience {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  start_time: string;
  created_by: string;
  status: ExperienceStatus;
  created_at: string;
}

export interface Booking {
  id: string;
  experience_id: string;
  user_id: string;
  seats: number;
  status: BookingStatus;
  created_at: string;
}

export interface JWTPayload {
  userId: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown[];
}
