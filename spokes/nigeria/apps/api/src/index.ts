import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { validateApiKey } from './middleware/apiKeyAuth';
import { requireSovrynSecret } from './middleware/requireSovrynSecret';
import verifyRouter from './routes/verify';
import consentRouter from './routes/consent';
import tokenRouter from './routes/token';
import fasttrackRouter from './routes/fasttrack';
import sovrynRouter from './routes/sovryn';
import statsRouter from './routes/stats';
import registryRouter from './routes/registry';
import { initializeRedis } from './services/temporalCache';

dotenv.config();

// SOVRYN Gateway CORS: ALLOWED_ORIGINS env maps to Access-Control-Allow-Origin (e.g. switch from * to Netlify URLs)
const allowedOriginsList = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || [];

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-sovryn-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.origin;
  const allowOrigin =
    allowedOriginsList.length === 0
      ? '*'
      : (origin && allowedOriginsList.includes(origin) ? origin : allowedOriginsList[0]);
  return { ...corsHeaders, 'Access-Control-Allow-Origin': allowOrigin };
}

const app: Express = express();
const PORT = process.env.PORT || 3000;

// OPTIONS handler MUST be the first middleware: return 200 OK with corsHeaders immediately on preflight
app.use((req: Request, res: Response, next) => {
  const headers = getCorsHeaders(req);
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: allowedOriginsList.length ? allowedOriginsList : true,
  credentials: true,
  allowedHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type', 'x-api-key', 'x-sovryn-key'],
  methods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
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
// SOVRYN audit routes from sovryn.ts: POST /v1/sovryn/audit, POST /v1/sovryn/audit-all (exported and recognized here)
app.use('/v1/sovryn', validateApiKey, requireSovrynSecret, sovrynRouter);
app.use('/v1/stats', validateApiKey, statsRouter);
app.use('/v1/registry', validateApiKey, registryRouter);

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
