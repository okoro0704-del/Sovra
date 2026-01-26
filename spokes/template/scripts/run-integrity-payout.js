/**
 * Manually run integrity payout for a specific period
 * Run with: npm run integrity:payout
 */

import dotenv from 'dotenv';
import { SovereignStore } from '../dist/data-sovereignty/sovereign-store.js';
import { IntegrityDividendEngine } from '../dist/integrity-dividend/payout-engine.js';

dotenv.config();

const periodId = process.argv[2] || new Date().toISOString().split('T')[0];

console.log(`🎯 Running integrity payout for period: ${periodId}\n`);

// Initialize components
const sovereignStore = new SovereignStore(
  process.env.DATABASE_PATH || './data/sovereign.db',
  process.env.DATABASE_ENCRYPTION_KEY
);

const integrityEngine = new IntegrityDividendEngine(
  process.env.DATABASE_PATH || './data/sovereign.db',
  sovereignStore
);

try {
  // Calculate payout
  console.log('📊 Calculating payout...');
  const period = await integrityEngine.calculateDailyPayout(periodId);
  
  console.log('\n✅ Payout calculated:');
  console.log(`   Total Fees: ${period.total_fees_received} uSOV`);
  console.log(`   Total Citizens: ${period.total_citizens}`);
  console.log(`   Total Verifications: ${period.total_verifications}`);
  console.log(`   Payout per Verification: ${period.payout_per_verification} uSOV`);

  // Distribute payout
  console.log('\n💰 Distributing payout...');
  const result = await integrityEngine.distributePayout(periodId);

  console.log('\n✅ Payout distributed:');
  console.log(`   Successful: ${result.distributed_count}`);
  console.log(`   Failed: ${result.failed_count}`);

  // Show stats
  const stats = integrityEngine.getPayoutStats(periodId);
  console.log('\n📈 Period Stats:');
  console.log(JSON.stringify(stats, null, 2));

} catch (error) {
  console.error('\n❌ Payout failed:', error);
  process.exit(1);
} finally {
  sovereignStore.close();
  integrityEngine.close();
}

