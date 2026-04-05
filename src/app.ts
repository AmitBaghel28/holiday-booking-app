import express from 'express';
import { requestLogger } from './middlewares/logger';
import { errorHandler } from './middlewares/errorHandler';
import { checkDBHealth } from './db';
import authRoutes from './routes/auth.routes';
import experiencesRoutes from './routes/experiences.routes';
import bookingsRoutes from './routes/bookings.routes';

const app = express();

app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) => {
  const dbOk = checkDBHealth();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'unreachable',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);
app.use('/experiences', experiencesRoutes);
app.use('/experiences/:id/book', bookingsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found', details: [] } });
});

app.use(errorHandler);

export default app;
