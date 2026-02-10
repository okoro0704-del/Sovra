/**
 * Global API (apps/api) - universal SOVRYN endpoint.
 * Netlify base directory: apps/api. Environment: SOVRYN_SECRET, SUPABASE_URL (and SUPABASE_SERVICE_ROLE_KEY).
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { validateApiKey } from './middleware/validateApiKey';
import { requireSovrynSecret } from './middleware/requireSovrynSecret';
import sovrynRouter from './routes/sovryn';

dotenv.config();

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS?.trim() || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-sovryn-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use((req: Request, res: Response, next) => {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'SOVRYN Global API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/v1/sovryn', validateApiKey, requireSovrynSecret, sovrynRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested resource was not found' });
});

app.use((err: Error, _req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
});

app.listen(PORT, () => {
  console.log(`🌐 SOVRYN Global API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   SOVRYN: POST /v1/sovryn/audit, POST /v1/sovryn/audit-all?country_code=NG`);
});

export default app;
