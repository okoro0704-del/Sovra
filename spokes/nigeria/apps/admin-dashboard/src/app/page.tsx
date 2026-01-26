'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [stats, setStats] = useState({
    citizens: 0,
    entities: 0,
    consents: 0,
  });

  useEffect(() => {
    // In a real implementation, fetch from API
    // For now, display placeholder
    setStats({
      citizens: 0,
      entities: 0,
      consents: 0,
    });
  }, []);

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
