/**
 * Citizen Registry for admin dashboard
 * GET /v1/registry - List all names and face_hashes from sovereign_identity (shared Supabase).
 * Requires X-API-KEY.
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data: rows, error } = await supabase
      .from('sovereign_identity')
      .select('id, user_address, did, face_hash, metadata')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        items: [],
      });
      return;
    }

    const items = (rows || []).map((r: any) => ({
      id: r.id,
      uid: r.user_address,
      did: r.did,
      name: r.metadata?.architect ?? r.metadata?.name ?? r.did ?? r.user_address ?? '—',
      face_hash: r.face_hash ?? null,
    }));

    res.status(200).json({
      success: true,
      items,
    });
  } catch (e) {
    console.error('Registry error:', e);
    res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : 'Failed to load registry',
      items: [],
    });
  }
});

export default router;
