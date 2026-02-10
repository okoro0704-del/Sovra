'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

type Toast = { show: boolean; message: string; success: boolean };

interface RegistryItem {
  id: string;
  uid: string;
  did: string | null;
  name: string;
  face_hash: string | null;
}

export default function Home() {
  const [stats, setStats] = useState({ citizens: 0, entities: 0, consents: 0 });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<{ ok: boolean; message?: string; detail?: Record<string, unknown> } | null>(null);
  const [toast, setToast] = useState<Toast>({ show: false, message: '', success: false });
  const [registryOpen, setRegistryOpen] = useState(false);
  const [registryItems, setRegistryItems] = useState<RegistryItem[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!API_URL || !API_KEY) return;
    try {
      const res = await fetch(`${API_URL}/v1/stats`, {
        headers: { 'X-API-KEY': API_KEY },
      });
      const data = await res.json();
      if (data.success) {
        setStats({
          citizens: data.citizens ?? 0,
          entities: data.entities ?? 0,
          consents: data.consents ?? 0,
        });
      }
    } catch {
      // keep previous stats
    }
  }, []);

  // Initial fetch + Supabase Realtime so counters update the moment connection is established and on any change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const channels: RealtimeChannel[] = [];

    const refetch = () => {
      if (API_URL && API_KEY) fetchStats();
    };

    channels.push(
      supabase.channel('citizens').on('postgres_changes', { event: '*', schema: 'public', table: 'citizens' }, refetch)
    );
    channels.push(
      supabase.channel('entities').on('postgres_changes', { event: '*', schema: 'public', table: 'registered_entities' }, refetch)
    );
    channels.push(
      supabase.channel('consents').on('postgres_changes', { event: '*', schema: 'public', table: 'consent_logs' }, refetch)
    );

    channels.forEach((ch) => ch.subscribe());

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [SUPABASE_URL, SUPABASE_ANON_KEY, fetchStats]);

  const showToast = (message: string, success: boolean) => {
    setToast({ show: true, message, success });
  };

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
    return () => clearTimeout(t);
  }, [toast.show]);

  const handleManualAudit = async () => {
    if (!API_URL || !API_KEY) {
      showToast('Configure NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_KEY', false);
      return;
    }
    setAuditLoading(true);
    setAuditResult(null);
    try {
      const res = await fetch(`${API_URL}/v1/sovryn/audit-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== undefined) {
        const processed = data.processed ?? 0;
        const succeeded = data.succeeded ?? 0;
        const failed = data.failed ?? 0;
        if (processed === 0) {
          showToast(data.message || 'No vitalized citizens with pending minting', true);
        } else if (failed === 0) {
          showToast(`Success: ${succeeded} citizen(s) minted (11 VIDA each).`, true);
        } else {
          showToast(`${succeeded} minted, ${failed} failed. ${data.message || ''}`, false);
        }
        setAuditResult({
          ok: failed === 0,
          message: data.message,
          detail: {
            processed: data.processed,
            succeeded: data.succeeded,
            failed: data.failed,
            results: data.results,
          },
        });
      } else {
        const msg = data.message || data.error || `Request failed (${res.status})`;
        showToast(msg, false);
        setAuditResult({ ok: false, message: msg, detail: data });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network error';
      showToast(msg, false);
      setAuditResult({ ok: false, message: msg });
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchRegistry = async () => {
    if (!API_URL || !API_KEY) return;
    setRegistryLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/registry`, {
        headers: { 'X-API-KEY': API_KEY },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setRegistryItems(data.items);
        setRegistryOpen(true);
      }
    } catch {
      showToast('Failed to load citizen registry', false);
    } finally {
      setRegistryLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      {toast.show && (
        <div
          className={toast.success ? styles.toastSuccess : styles.toastError}
          role="alert"
        >
          {toast.message}
        </div>
      )}

      <div className={styles.container}>
        <h1 className={styles.title}>SOVRN Protocol Admin Dashboard</h1>
        <p className={styles.subtitle}>Decentralized Identity & Consent Oversight</p>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h2 className={styles.statNumber}>{stats.citizens.toLocaleString()}</h2>
            <p className={styles.statLabel}>Registered Citizens</p>
          </div>
          <div className={styles.statCard}>
            <h2 className={styles.statNumber}>{stats.entities.toLocaleString()}</h2>
            <p className={styles.statLabel}>Registered Entities</p>
          </div>
          <div className={styles.statCard}>
            <h2 className={styles.statNumber}>{stats.consents.toLocaleString()}</h2>
            <p className={styles.statLabel}>Consent Logs</p>
          </div>
        </div>

        {(!API_URL || !API_KEY) && (
          <p className={styles.configHint}>
            Set <code>NEXT_PUBLIC_API_URL</code> and <code>NEXT_PUBLIC_API_KEY</code> to load live stats and use Manual Audit.
          </p>
        )}

        <section className={styles.section}>
          <h2>Command</h2>
          <p>
            Emergency SOVRYN controls. Manual Audit scans for citizens with <code>is_vitalized: true</code> and{' '}
            <code>minting_status: null</code>, triggers 11 VIDA minting for each, then updates status.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className={styles.manualAuditButton}
              onClick={handleManualAudit}
              disabled={auditLoading}
            >
              {auditLoading ? 'Running…' : 'Manual Audit'}
            </button>
            {auditResult && (
              <div
                className={auditResult.ok ? styles.auditSuccess : styles.auditError}
                style={{ marginTop: '0.75rem' }}
              >
                {auditResult.message}
                {auditResult.detail && Object.keys(auditResult.detail).length > 0 && (
                  <pre style={{ fontSize: '0.85rem', marginTop: '0.5rem', overflow: 'auto' }}>
                    {JSON.stringify(auditResult.detail, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </section>

        <div className={styles.sections}>
          <section className={styles.section}>
            <h2>Citizen Registry</h2>
            <p>View and manage citizen registrations (names and face_hashes from shared Supabase).</p>
            <button
              type="button"
              className={styles.registryButton}
              onClick={fetchRegistry}
              disabled={registryLoading || !API_URL || !API_KEY}
            >
              {registryLoading ? 'Loading…' : 'View registry'}
            </button>
            {registryOpen && (
              <div className={styles.registryTableWrap}>
                <table className={styles.registryTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Face hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registryItems.length === 0 ? (
                      <tr>
                        <td colSpan={2}>No records</td>
                      </tr>
                    ) : (
                      registryItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td className={styles.faceHash}>{item.face_hash ?? '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section className={styles.section}>
            <h2>Entity Management</h2>
            <p>Manage registered entities and API keys.</p>
            <p className={styles.sectionHint}>Coming soon: entity list and key rotation</p>
          </section>
          <section className={styles.section}>
            <h2>Consent Analytics</h2>
            <p>Monitor consent logs and patterns.</p>
            <p className={styles.sectionHint}>Coming soon: charts and export</p>
          </section>
        </div>
      </div>
    </main>
  );
}
