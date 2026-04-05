import crypto from 'crypto';
import db from '../db';
import { Experience } from '../types';
import { CreateExperienceInput, ListExperiencesInput } from '../validators/experience.validator';
import { AppError } from '../middlewares/errorHandler';

export function createExperience(input: CreateExperienceInput, userId: string): Experience {
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO experiences (id, title, description, location, price, start_time, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
  `).run(id, input.title, input.description, input.location, input.price, input.start_time, userId);

  return db.prepare('SELECT * FROM experiences WHERE id = ?').get(id) as Experience;
}

export function publishExperience(id: string, userId: string, userRole: string): Experience {
  const experience = getExperienceOrThrow(id);

  if (experience.status === 'blocked') {
    throw new AppError(403, 'EXPERIENCE_BLOCKED', 'Blocked experiences cannot be published');
  }

  if (userRole !== 'admin' && experience.created_by !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Only the owner or admin can publish this experience');
  }

  db.prepare("UPDATE experiences SET status = 'published' WHERE id = ?").run(id);
  return db.prepare('SELECT * FROM experiences WHERE id = ?').get(id) as Experience;
}

export function blockExperience(id: string): Experience {
  getExperienceOrThrow(id);
  db.prepare("UPDATE experiences SET status = 'blocked' WHERE id = ?").run(id);
  return db.prepare('SELECT * FROM experiences WHERE id = ?').get(id) as Experience;
}

export function listPublishedExperiences(query: ListExperiencesInput): {
  data: Experience[];
  page: number;
  limit: number;
  total: number;
} {
  const { location, from, to, page, limit, sort } = query;
  const offset = (page - 1) * limit;

  const conditions: string[] = ["status = 'published'"];
  const params: unknown[] = [];

  if (location) {
    conditions.push('location LIKE ?');
    params.push(`%${location}%`);
  }
  if (from) {
    conditions.push('start_time >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('start_time <= ?');
    params.push(to);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM experiences ${where}`).get(...params) as { count: number }
  ).count;

  const data = db
    .prepare(
      `SELECT * FROM experiences ${where} ORDER BY start_time ${sort.toUpperCase()} LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Experience[];

  return { data, page, limit, total };
}

function getExperienceOrThrow(id: string): Experience {
  const exp = db.prepare('SELECT * FROM experiences WHERE id = ?').get(id) as Experience | undefined;
  if (!exp) throw new AppError(404, 'NOT_FOUND', 'Experience not found');
  return exp;
}
