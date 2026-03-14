import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import locationRoutes from './routes/locations';
import skillRoutes from './routes/skills';
import invitationRoutes from './routes/invitations';

const app = express();

// Core middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/invitations', invitationRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
