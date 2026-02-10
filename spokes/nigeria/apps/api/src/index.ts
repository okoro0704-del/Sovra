import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { validateApiKey } from './middleware/apiKeyAuth';
import verifyRouter from './routes/verify';
import consentRouter from './routes/consent';
import tokenRouter from './routes/token';
import fasttrackRouter from './routes/fasttrack';
import sovrynRouter from './routes/sovryn';
import { initializeRedis } from './services/temporalCache';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'SOVRN Protocol API',
    timestamp: new Date().toISOString()
  });
});

// API routes with authentication
app.use('/v1/verify', validateApiKey, verifyRouter);
app.use('/v1/consent', validateApiKey, consentRouter);
app.use('/v1/token', validateApiKey, tokenRouter);
app.use('/v1/fasttrack', validateApiKey, fasttrackRouter);
app.use('/v1/sovryn', validateApiKey, sovrynRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
});

// Initialize Redis for temporal caching
initializeRedis()
  .then(() => {
    console.log('✅ Redis temporal cache initialized');
  })
  .catch((err) => {
    console.error('⚠️ Redis initialization failed:', err);
    console.log('Fast-track API will operate without caching');
  });

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SOVRN Protocol API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 API endpoints require X-API-KEY header`);
  console.log(`⚡ Fast-Track API: /v1/fasttrack/verify (target: <500ms)`);
});

export default app;
