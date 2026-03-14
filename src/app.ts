import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Core middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes will be mounted here as they're built
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/locations', locationRoutes);
// etc.

// Error handler (must be last)
app.use(errorHandler);

export default app;
