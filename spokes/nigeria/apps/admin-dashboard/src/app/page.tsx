'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

export default function Home() {
  const [stats, setStats] = useState({
    citizens: 0,
    entities: 0,
    consents: 0,
  });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<{ ok: boolean; message?: string; detail?: Record<string, unknown> } | null>(null);

  useEffect(() => {
    // In a real implementation, fetch from API
    // For now, display placeholder
    setStats({
      citizens: 0,
      entities: 0,
      consents: 0,
    });
  }, []);

  const handleManualAudit = async () => {
    if (!API_URL || !API_KEY) {
      setAuditResult({ ok: false, message: 'Configure NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_KEY' });
      return;
    }
    setAuditLoading(true);
    setAuditResult(null);
    try {
      const res = await fetch(`${API_URL}/v1/sovryn/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setAuditResult({
          ok: true,
          message: data.message || 'SOVRYN audit completed',
          detail: {
            architectUid: data.architectUid,
            releaseId: data.releaseId,
            mintingStatus: data.mintingStatus,
            assumedControl: data.assumedControl,
          },
        });
      } else {
        setAuditResult({
          ok: false,
          message: data.message || data.error || `Request failed (${res.status})`,
          detail: data,
        });
      }
    } catch (e) {
      setAuditResult({
        ok: false,
        message: e instanceof Error ? e.message : 'Network error',
      });
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <main className={styles.main}>
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

        <section className={styles.section}>
          <h2>Command</h2>
          <p>Emergency SOVRYN controls. Manual Audit triggers the SOVRYN request directly when the automatic hook failed.</p>
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
              <div className={auditResult.ok ? styles.auditSuccess : styles.auditError} style={{ marginTop: '0.75rem' }}>
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
            <p>View and manage citizen registrations</p>
          </section>
          <section className={styles.section}>
            <h2>Entity Management</h2>
            <p>Manage registered entities and API keys</p>
          </section>
          <section className={styles.section}>
            <h2>Consent Analytics</h2>
            <p>Monitor consent logs and patterns</p>
          </section>
        </div>
      </div>
    </main>
  );
}
