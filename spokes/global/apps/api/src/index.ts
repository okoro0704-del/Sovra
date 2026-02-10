/**
 * Universal endpoint - SOVRYN API for all spokes.
 * Uses @sovrn/core-logic (Minting, Face Audit, WebAuthn).
 * Spokes/nigeria is optional and can add special rules; this API is country-agnostic.
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { getGlobalFoundationAddress, VIDA_TOTAL } from '@sovrn/core-logic';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true }));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'SOVRYN Universal API',
    timestamp: new Date().toISOString(),
    core: { vidaTotal: VIDA_TOTAL, foundationAddress: getGlobalFoundationAddress().slice(0, 10) + '...' },
  });
});

// Placeholder: mount /v1/sovryn, /v1/stats, etc. here or proxy to a spoke
// For full implementation, copy route modules from spokes/nigeria/apps/api and wire to core-logic + Supabase
app.use('/v1', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Universal /v1 routes: configure Supabase and add route modules (sovryn, stats, registry) or proxy to spokes/nigeria.',
  });
});

app.listen(PORT, () => {
  console.log(`🌐 SOVRYN Universal API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

export default app;
