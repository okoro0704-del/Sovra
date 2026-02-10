# 🚀 VITALIA MONOREPO - QUICK START GUIDE

**"One pulse, one identity, one nation."**

---

## 📦 INSTALLATION

### 1. Install Dependencies
```bash
# Install Yarn (if not already installed)
npm install -g yarn

# Install all dependencies
yarn install
```

### 2. Build Packages
```bash
# Build all packages
yarn build

# Or build individually
cd packages/pff-engine && yarn build
cd packages/contracts && yarn build
```

---

## 📱 RUNNING THE APPS

### Vitalia One (Personal App)
```bash
# Start Metro bundler
yarn workspace @vitalia/one start

# Run on Android
yarn workspace @vitalia/one android

# Run on iOS
yarn workspace @vitalia/one ios
```

### Vitalia Business (Agent/Kiosk App)
```bash
# Start Metro bundler
yarn workspace @vitalia/business start

# Run on Android
yarn workspace @vitalia/business android

# Run on iOS
yarn workspace @vitalia/business ios
```

---

## 🔑 KEY CONCEPTS

### The Truth Gate (VitalizedGate HOC)
Wrap any screen to protect it with heartbeat verification:

```tsx
import { VitalizedGate } from '@vitalia/pff-engine';

export default function ProtectedScreen() {
  return (
    <VitalizedGate
      onLifeConfirmed={(bpm) => console.log('Unlocked with BPM:', bpm)}
      onSpoofingDetected={() => console.log('Spoofing detected')}
    >
      <YourProtectedContent />
    </VitalizedGate>
  );
}
```

### First Pulse Registration (onFirstPulse)
Register user and mint 20 VIDA with 50/50 split:

```tsx
import { registerUser } from '@vitalia/contracts';

const onFirstPulse = async (bpm: number) => {
  const result = await registerUser(
    phoneNumber,
    bpm,
    true // liveness confirmed
  );

  console.log('Minted:', result.totalMinted); // 20 VIDA
  console.log('User Liquid:', result.userLiquid); // 5 VIDA
  console.log('User Locked:', result.userLocked); // 5 VIDA
  console.log('Vault:', result.vaultAmount); // 10 VIDA
};
```

### Heartbeat Detection (Worklet)
Process frames in real-time with NPU acceleration:

```tsx
import { processHeartbeat } from '@vitalia/pff-engine';
import { useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  
  const result = processHeartbeat(frame);
  runOnJS(handleResult)(result);
}, []);
```

### NFC Card Issuance
Write Vitalia Life Card for instant access:

```tsx
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

const writeNFCCard = async (userId: string) => {
  await NfcManager.start();
  await NfcManager.requestTechnology(NfcTech.Ndef);
  
  const bytes = NfcManager.ndefHandler.encodeMessage([
    { tnf: 1, type: 'T', payload: `vitalia:${userId}` },
  ]);
  
  await NfcManager.ndefHandler.writeNdefMessage(bytes);
  NfcManager.cancelTechnologyRequest();
};
```

---

## 📂 PROJECT STRUCTURE

```
CEDCaPSS/
├── package.json (Monorepo root)
├── apps/
│   ├── vitalia-one/          # Personal App
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── screens/
│   │   │       ├── WelcomeScreen.tsx
│   │   │       ├── VaultScreen.tsx
│   │   │       └── BridgeScreen.tsx
│   │   └── package.json
│   └── vitalia-business/     # Agent/Kiosk App
│       ├── src/
│       │   ├── App.tsx
│       │   └── screens/
│       │       ├── HomeScreen.tsx
│       │       ├── AssistedRegistrationScreen.tsx
│       │       └── LiquidityProviderScreen.tsx
│       └── package.json
└── packages/
    ├── pff-engine/           # POS Algorithm
    │   ├── src/
    │   │   ├── worklet.ts
    │   │   ├── VitalizedGate.tsx
    │   │   ├── types.ts
    │   │   └── index.ts
    │   └── package.json
    └── contracts/            # VIDA/nVIDA Logic
        ├── src/
        │   ├── SovereignChain.ts
        │   └── index.ts
        └── package.json
```

---

**🔐 Sovereign. ✅ Verified. ⚡ Biological.**

**Born in Lagos, Nigeria. Built for Truth.** 🇳🇬

