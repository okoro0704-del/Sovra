/**
 * Admin stats for dashboard
 * GET /v1/stats - Counts: citizens (Master citizens table), entities, consent logs.
 * Requires X-API-KEY.
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const [citizensRes, entitiesRes, consentsRes] = await Promise.all([
      supabase.from('citizens').select('id', { count: 'exact', head: true }),
      supabase.from('registered_entities').select('id', { count: 'exact', head: true }),
      supabase.from('consent_logs').select('id', { count: 'exact', head: true }),
    ]);

    const citizens = citizensRes.error ? 0 : (citizensRes.count ?? 0);
    const entities = entitiesRes.error ? 0 : (entitiesRes.count ?? 0);
    const consents = consentsRes.error ? 0 : (consentsRes.count ?? 0);

    res.status(200).json({
      success: true,
      citizens,
      entities,
      consents,
    });
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({
      success: false,
      message: e instanceof Error ? e.message : 'Failed to load stats',
      citizens: 0,
      entities: 0,
      consents: 0,
    });
  }
});

export default router;
