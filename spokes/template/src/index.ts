/**
 * SOVRN Spoke Template - Main Entry Point
 * 
 * This is the reference implementation for national governments
 * to deploy their own SOVRN spoke with data sovereignty.
 */

import dotenv from 'dotenv';
import express from 'express';
import { CronJob } from 'cron';
import { SovereignStore } from './data-sovereignty/sovereign-store';
import { HubConnectorGateway, HubRequestType } from './hub-connector/gateway';
import { IntegrityDividendEngine } from './integrity-dividend/payout-engine';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'SPOKE_ID',
  'DATABASE_ENCRYPTION_KEY',
  'GLOBAL_HUB_PUBLIC_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize components
const sovereignStore = new SovereignStore(
  process.env.DATABASE_PATH || './data/sovereign.db',
  process.env.DATABASE_ENCRYPTION_KEY!
);

const hubGateway = new HubConnectorGateway(
  process.env.GLOBAL_HUB_PUBLIC_KEY!,
  sovereignStore
);

const integrityEngine = new IntegrityDividendEngine(
  process.env.DATABASE_PATH || './data/sovereign.db',
  sovereignStore
);

// Create Express app
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = sovereignStore.getStats();
  res.json({
    status: 'healthy',
    spoke_id: process.env.SPOKE_ID,
    timestamp: new Date().toISOString(),
    stats,
  });
});

// Hub connector endpoint (ONLY accepts requests from Global Hub)
app.post('/hub/request', async (req, res) => {
  try {
    const response = await hubGateway.processHubRequest(req.body);
    res.json(response);
  } catch (error) {
    logger.error('Hub request failed', { error });
    res.status(403).json({
      error: error instanceof Error ? error.message : 'Request processing failed',
    });
  }
});

// Integrity dividend stats endpoint
app.get('/integrity/stats', (req, res) => {
  const periodId = req.query.period as string | undefined;
  const stats = integrityEngine.getPayoutStats(periodId);
  res.json(stats);
});

// Citizen payout history endpoint
app.get('/integrity/citizen/:did', (req, res) => {
  const history = integrityEngine.getCitizenPayoutHistory(req.params.did);
  res.json(history);
});

// Database stats endpoint
app.get('/stats', (req, res) => {
  const stats = sovereignStore.getStats();
  res.json(stats);
});

// Setup daily integrity payout cron job
if (process.env.INTEGRITY_PAYOUT_ENABLED === 'true') {
  const schedule = process.env.INTEGRITY_PAYOUT_SCHEDULE || '0 0 * * *'; // Daily at midnight

  const payoutJob = new CronJob(schedule, async () => {
    try {
      const periodId = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      logger.info('Running daily integrity payout', { periodId });

      // Calculate payout
      await integrityEngine.calculateDailyPayout(periodId);

      // Distribute payout
      await integrityEngine.distributePayout(periodId);

      logger.info('Daily integrity payout complete', { periodId });
    } catch (error) {
      logger.error('Daily integrity payout failed', { error });
    }
  });

  payoutJob.start();
  logger.info('Integrity payout cron job started', { schedule });
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info('SOVRA Spoke started', {
    spoke_id: process.env.SPOKE_ID,
    port: PORT,
    country: process.env.COUNTRY_NAME,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  sovereignStore.close();
  hubGateway.destroy();
  integrityEngine.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  sovereignStore.close();
  hubGateway.destroy();
  integrityEngine.close();
  process.exit(0);
});

