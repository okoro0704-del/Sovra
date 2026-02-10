# 🚀 PFF-SOVRYN QUICK REFERENCE GUIDE

**"The Physical Key unlocks the Financial Vault."**

---

## 📚 IMPORT STATEMENTS

```typescript
// Session Management
import {
  getSovereignSessionManager,
  initializeSovereignSession,
  isSovereignVaultUnlocked,
  getCurrentSovereignSession,
} from '@vitalia/contracts';

// Transaction Interceptor
import {
  interceptSovrynTransaction,
  SovereignGateError,
  canExecuteSovrynTransaction,
} from '@vitalia/contracts';

// Sovryn Client
import {
  SovrynClient,
  RSK_MAINNET_CONFIG,
  RSK_TESTNET_CONFIG,
} from '@vitalia/contracts';

// Presence Gate
import {
  generatePresenceProof,
  validatePresenceProof,
} from '@vitalia/contracts';
```

---

## 🔑 KEY FUNCTIONS

### **1. Initialize Session (After PFF Scan)**

```typescript
// Generate presence proof
const proof = await generatePresenceProof(
  uid,           // User ID
  scanResult,    // PFF scan result (BPM, confidence)
  privateKey     // User's private key
);

// Initialize sovereign session
await initializeSovereignSession(
  uid,
  walletAddress,
  proof
);

// Session is now active (Sovereign_Active = true ✅)
```

### **2. Check Vault Status**

```typescript
// Method 1: Simple boolean check
const isUnlocked = isSovereignVaultUnlocked();

// Method 2: Get full session status
const manager = getSovereignSessionManager();
const status = manager.getSessionStatus();

console.log('Sovereign Active:', status.sovereignActive);
console.log('Time Remaining:', status.timeRemaining);
console.log('Presence Valid:', status.presenceValid);
```

### **3. Execute Sovryn Transaction**

```typescript
// Create Sovryn client
const sovryn = new SovrynClient(RSK_MAINNET_CONFIG);
await sovryn.connectWallet(provider);

// Execute trade (automatically gated)
try {
  const txHash = await sovryn.trade({
    fromToken: RBTC_ADDRESS,
    toToken: DLLR_ADDRESS,
    amount: '0.1',
    minReturn: '4500',
    deadline: Date.now() + 600000,
  });
  
  console.log('Trade successful:', txHash);
} catch (error) {
  if (error instanceof SovereignGateError) {
    // Session expired - redirect to PFF scan
    navigation.navigate('Welcome');
  }
}
```

### **4. Monitor Session in Real-time**

```typescript
useEffect(() => {
  const manager = getSovereignSessionManager();
  
  const interval = setInterval(() => {
    const status = manager.getSessionStatus();
    setSovereignActive(status.sovereignActive);
    setTimeRemaining(status.timeRemaining);
  }, 1000); // Update every second

  return () => clearInterval(interval);
}, []);
```

### **5. Renew Session (New Heartbeat Scan)**

```typescript
// Generate new presence proof
const newProof = await generatePresenceProof(uid, newScanResult, privateKey);

// Renew session
const manager = getSovereignSessionManager();
await manager.renewPresenceProof(newProof);

// Session extended (Sovereign_Active = true ✅)
```

### **6. Destroy Session (Logout)**

```typescript
const manager = getSovereignSessionManager();
manager.destroySession();

// Session destroyed (Sovereign_Active = false 🔒)
```

---

## ⏱️ TIMEOUTS

| Timeout Type | Duration | Action |
|--------------|----------|--------|
| **Session Timeout** | 5 minutes | Auto-expire session on inactivity |
| **Presence Timeout** | 60 seconds | Auto-expire presence proof |
| **Monitoring Interval** | 10 seconds | Background check for expiry |

---

## 🎨 UI PATTERNS

### **Pattern 1: Conditional Vault Rendering**

```typescript
{isSovereignVaultUnlocked() ? (
  // Sovryn Vault Stats (visible)
  <SovrynVaultCard
    collateral={collateral}
    debt={debt}
    ratio={ratio}
  />
) : (
  // Invisible Vault Card
  <InvisibleVaultCard
    onUnlock={() => navigation.navigate('Welcome')}
  />
)}
```

### **Pattern 2: Session Status Display**

```typescript
<View style={styles.statusCard}>
  <Text style={styles.statusIcon}>
    {sovereignActive ? '🔓' : '🔒'}
  </Text>
  <Text style={styles.statusTitle}>
    {sovereignActive ? 'Vault Unlocked' : 'Vault Locked'}
  </Text>
  <Text style={styles.statusSubtitle}>
    {sovereignActive
      ? `Expires in ${timeRemaining}s`
      : 'Scan heartbeat to unlock'}
  </Text>
</View>
```

### **Pattern 3: Error Handling**

```typescript
try {
  await sovryn.trade({ ... });
} catch (error) {
  if (error instanceof SovereignGateError) {
    Alert.alert(
      '🔒 Vault Locked',
      'Complete a heartbeat scan to unlock your Sovryn vault.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Scan Heartbeat',
          onPress: () => navigation.navigate('Welcome'),
        },
      ]
    );
  } else {
    Alert.alert('Error', error.message);
  }
}
```

---

## 🔐 SECURITY CHECKLIST

- ✅ **Never store private keys in plain text**
- ✅ **Always validate presence proof before session creation**
- ✅ **Check Sovereign_Active flag before sensitive operations**
- ✅ **Use HTTPS for all network requests**
- ✅ **Implement rate limiting for session creation**
- ✅ **Log all session events for audit trail**
- ✅ **Clear session data on app logout**

---

## 🐛 COMMON ISSUES

### **Issue 1: Transaction Blocked**

**Error**: `SovereignGateError: Transaction blocked: Sovereign_Active = false`

**Solution**: User needs to complete PFF heartbeat scan

```typescript
navigation.navigate('Welcome', {
  returnTo: 'UnifiedVault',
  onScanComplete: handlePresenceScanComplete,
});
```

### **Issue 2: Session Expired**

**Error**: Session status shows `sovereignActive = false`

**Solution**: Check timeout values and renew session

```typescript
const status = manager.getSessionStatus();
console.log('Session expired:', !status.sovereignActive);
console.log('Reason:', status.presenceValid ? 'Session timeout' : 'Presence timeout');
```

### **Issue 3: Vault Not Visible**

**Error**: Sovryn vault stats not showing in Unified Vault Screen

**Solution**: Verify Sovereign_Active flag

```typescript
const isUnlocked = isSovereignVaultUnlocked();
console.log('Vault unlocked:', isUnlocked);

if (!isUnlocked) {
  // Redirect to PFF scan
  navigation.navigate('Welcome');
}
```

---

## 📊 TESTING COMMANDS

```bash
# Run unit tests
yarn test packages/contracts/src/sovryn/

# Run integration tests
yarn test apps/vitalia-one/src/screens/UnifiedVaultScreen.test.tsx

# Check TypeScript types
yarn tsc --noEmit

# Lint code
yarn lint
```

---

## 🔗 RELATED FILES

| File | Purpose |
|------|---------|
| `packages/contracts/src/sovryn/SovereignSession.ts` | Session management |
| `packages/contracts/src/sovryn/TransactionInterceptor.ts` | Transaction gating |
| `packages/contracts/src/sovryn/SovrynClient.ts` | Sovryn Protocol integration |
| `apps/vitalia-one/src/screens/UnifiedVaultScreen.tsx` | Unified Vault UI |
| `PFF_SOVRYN_FINALIZATION_COMPLETE.md` | Full documentation |

---

## 🌟 QUICK TIPS

1. **Always check `Sovereign_Active` before Sovryn operations**
2. **Use `isSovereignVaultUnlocked()` for simple boolean checks**
3. **Use `getSessionStatus()` for detailed session info**
4. **Monitor session in real-time with 1-second intervals**
5. **Handle `SovereignGateError` gracefully with user-friendly messages**
6. **Test session expiry scenarios (5 min and 60 sec)**
7. **Use conditional rendering for vault visibility**

---

**🔐 Sovereign. ✅ Verified. ⚡ Biological.**

*"The Physical Key unlocks the Financial Vault."*

