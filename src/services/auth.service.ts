import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db';
import { User, JWTPayload } from '../types';
import { SignupInput, LoginInput } from '../validators/auth.validator';
import { AppError } from '../middlewares/errorHandler';

const SALT_ROUNDS = 12;

export function signup(input: SignupInput): { token: string; user: { id: string; role: string } } {
  const { email, password, role } = input;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }

  const id = crypto.randomUUID();
  const password_hash = bcrypt.hashSync(password, SALT_ROUNDS);

  db.prepare(
    'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(id, email, password_hash, role);

  const token = signToken({ userId: id, role });
  return { token, user: { id, role } };
}

export function login(input: LoginInput): { token: string; user: { id: string; role: string } } {
  const { email, password } = input;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: { id: user.id, role: user.role } };
}

function signToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError(500, 'CONFIG_ERROR', 'JWT secret not configured');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}
