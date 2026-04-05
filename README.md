# Yoliday — Experiences Marketplace Backend

Backend assessment for the Yoliday platform. Implements auth, role-based access control, experience management, and booking logic.

---

## Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js v20+ |
| Framework | Express 4.x |
| Language | TypeScript (strict mode) |
| Database | SQLite via better-sqlite3 |
| Auth | JWT + bcryptjs |
| Validation | Zod |

---

## Project Structure

```
src/
├── routes/        # HTTP route definitions
├── services/      # Business logic
├── db/            # Database connection and schema
├── middlewares/   # Auth, RBAC, error handling, logging
├── validators/    # Zod schemas
└── types/         # Shared TypeScript interfaces
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Start development server
npm run dev

# 4. Production build
npm run build && npm start
```

Database tables are created automatically on first run.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `DATABASE_URL` | SQLite file path (default: ./data.db) |
| `JWT_SECRET` | Secret key for signing JWTs |

---

## Database Schema

```sql
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK(role IN ('admin', 'host', 'user')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE experiences (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  location    TEXT NOT NULL,
  price       INTEGER NOT NULL CHECK(price >= 0),
  start_time  TEXT NOT NULL,
  created_by  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'draft'
                CHECK(status IN ('draft', 'published', 'blocked')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE bookings (
  id            TEXT PRIMARY KEY,
  experience_id TEXT NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seats         INTEGER NOT NULL CHECK(seats >= 1),
  status        TEXT NOT NULL DEFAULT 'confirmed'
                  CHECK(status IN ('confirmed', 'cancelled')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Indexes

| Index | Columns | Reason |
|---|---|---|
| `idx_experiences_location_time` | `location, start_time` | Speeds up public listing endpoint which filters by location and sorts by start_time |
| `idx_bookings_user_experience` | `user_id, experience_id` | Speeds up duplicate booking check on every booking request |

---

## RBAC Rules

- Admin role cannot be self-assigned at signup — only via direct DB insert
- Hosts can create experiences; new experiences default to `draft`
- A host can publish only their own experience
- Admin can publish any experience
- Admin can block any experience (moderation)
- Users can book published experiences
- Hosts cannot book any experience
- A user cannot have two `confirmed` bookings for the same experience

---

## API Endpoints

### Health Check

```bash
curl http://localhost:3000/health
```

### Signup

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "host@example.com", "password": "secret123", "role": "host"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "host@example.com", "password": "secret123"}'
```

### Create Experience

```bash
curl -X POST http://localhost:3000/experiences \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Taj Mahal Sunrise Walk",
    "description": "A guided walk around the Taj Mahal at sunrise.",
    "location": "Agra",
    "price": 1500,
    "start_time": "2025-09-01T05:30:00.000Z"
  }'
```

### Publish Experience

```bash
curl -X PATCH http://localhost:3000/experiences/<ID>/publish \
  -H "Authorization: Bearer <HOST_TOKEN>"
```

### Block Experience (Admin)

```bash
curl -X PATCH http://localhost:3000/experiences/<ID>/block \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### List Published Experiences

```bash
curl "http://localhost:3000/experiences?location=Agra&page=1&limit=5&sort=asc"
```

### Book an Experience

```bash
curl -X POST http://localhost:3000/experiences/<ID>/book \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"seats": 2}'
```

---

## Error Response Shape

```json
{
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

| Code | Meaning |
|---|---|
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict (duplicate email or booking) |
| 500 | Server error |

---

## Observability

Every request is logged as structured JSON:

```json
{
  "timestamp": "2025-06-01T10:00:00.000Z",
  "method": "POST",
  "path": "/experiences",
  "status": 201,
  "latency_ms": 12
}
```

The `/health` endpoint checks live database connectivity before responding.

## Repository

GitHub: https://github.com/AmitBaghel28/yoliday

