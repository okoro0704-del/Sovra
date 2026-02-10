# PFF Engine v2 - Usage Guide

**VITALIA POS Algorithm (Plane-Orthogonal-to-Skin)**  
**Optimized for Lagos 2026 Hardware (NPU Accelerated)**

---

## 🚀 TWO IMPLEMENTATION OPTIONS

### **Option 1: NPU-Accelerated Worklet (RECOMMENDED for Production)**

Use this for **real-time camera processing** with **zero-lag** on Lagos 2026 hardware.

```typescript
import { processHeartbeat, resetWorkletState } from './heart/PffEngine';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';

function HeartbeatScanner() {
  const device = useCameraDevice('front');
  const [scanResult, setScanResult] = useState(null);

  // Reset state when starting new scan
  useEffect(() => {
    resetWorkletState();
  }, []);

  // Process frames on the UI thread/NPU
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    const result = processHeartbeat(frame);
    
    // Update UI (runs on JS thread)
    runOnJS(setScanResult)(result);
  }, []);

  return (
    <Camera
      device={device}
      frameProcessor={frameProcessor}
      isActive={true}
    />
  );
}
```

**Worklet Result**:
```typescript
{
  liveness: boolean,
  bpm: number,
  status: 'LIFE_CONFIRMED' | 'SPOOFING_DETECTED' | 'INVALID_BPM' | 'COLLECTING_DATA'
}
```

---

### **Option 2: Class-Based Implementation (For Advanced Use Cases)**

Use this for **debugging**, **testing**, or when you need **full control** over the algorithm.

```typescript
import { PffEngine } from './heart/PffEngine';

// Create engine instance
const pffEngine = new PffEngine('session_123');

// Process frames
function onCameraFrame(frame: VideoFrame, faceRegion: FaceRegion) {
  pffEngine.processFrame(frame, faceRegion);
  
  // Analyze after collecting enough frames
  const result = pffEngine.analyzeScan();
  
  if (result.lifeStatus === 'LIFE_CONFIRMED') {
    console.log(`✅ LIFE CONFIRMED! BPM: ${result.bpm}, HRV: ${result.hrv}`);
  }
}

// Reset for new scan
pffEngine.reset();
```

**Class-Based Result**:
```typescript
{
  isLive: boolean,
  heartbeatDetected: boolean,
  bpm: number,
  snr: number,
  confidence: number,
  lifeStatus: 'LIFE_CONFIRMED' | 'NO_HEARTBEAT' | 'SPOOFING_DETECTED' | 'INSUFFICIENT_DATA',
  timestamp: number,
  sessionId: string,
  rawSignal?: number[],
  hrv?: number
}
```

---

## 🔐 THE TRUTH GATE (Liveness Detection)

Both implementations use **HRV-based liveness detection** to prevent spoofing:

### **What Gets Rejected**:
- ❌ **Photos**: Too static (variance < 0.01)
- ❌ **Video Playback**: Too perfect (HRV < 5)
- ❌ **Random Noise**: Too erratic (relative diff > 2.0)
- ❌ **Invalid BPM**: Outside 40-140 range

### **What Gets Accepted**:
- ✅ **Live Human Heartbeat**: Natural variability (5 < HRV < 50)
- ✅ **Valid BPM**: 40-140 beats per minute
- ✅ **Good Signal Quality**: SNR > 1.0

---

## ⚡ PERFORMANCE COMPARISON

| Feature | Worklet (Option 1) | Class-Based (Option 2) |
|---------|-------------------|------------------------|
| **Processing Thread** | UI Thread/NPU | JS Thread |
| **Latency** | Zero-lag | ~16ms per frame |
| **Frame Rate** | 30+ FPS | 15-30 FPS |
| **Memory Usage** | Low (global state) | Medium (instance state) |
| **Debugging** | Limited | Full access |
| **Use Case** | Production | Development/Testing |

---

## 📊 ALGORITHM FLOW

```
Camera Frame
    ↓
Extract Mean RGB from Face ROI
    ↓
Temporal Normalization (remove lighting bias)
    normR = r / averageR
    normG = g / averageG
    normB = b / averageB
    ↓
POS Projection Math (isolate pulse from motion)
    S1 = normG - normB
    S2 = normG + normB - 2 * normR
    alpha = stdS1 / stdS2
    pulseSignal = S1 + (alpha * S2)
    ↓
Liveness Check (The Truth Gate)
    - isStatic? → REJECT
    - isErratic? → REJECT
    - HRV out of range? → REJECT
    ↓
Calculate BPM from Pure Pulse Signal
    ↓
Validate BPM (40-140 range)
    ↓
LIFE_CONFIRMED ✅
```

---

## 🎯 INTEGRATION EXAMPLES

### **Vitalia One (User App)**

```typescript
// WelcomeScreen.tsx
import { processHeartbeat, resetWorkletState } from '../../heart/PffEngine';

const startMasterPulseScan = () => {
  resetWorkletState();
  setScanning(true);
};

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  const result = processHeartbeat(frame);
  
  if (result.status === 'LIFE_CONFIRMED') {
    runOnJS(onLifeConfirmed)(result.bpm);
  }
}, []);
```

### **Vitalia Business (Kiosk App)**

```typescript
// AssistedRegistrationScreen.tsx
import { processHeartbeat, resetWorkletState } from '../../../heart/PffEngine';

const scanCustomer = () => {
  resetWorkletState();
  setScanning(true);
};

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  const result = processHeartbeat(frame);
  
  runOnJS(updateScanProgress)(result);
  
  if (result.status === 'LIFE_CONFIRMED') {
    runOnJS(registerCustomer)(result.bpm);
  }
}, []);
```

---

## 🔧 TROUBLESHOOTING

### **Issue**: "worklet is not defined"
**Solution**: Make sure you have `react-native-reanimated` installed and configured.

### **Issue**: "frame.getMeanRGB is not a function"
**Solution**: Update `react-native-vision-camera` to latest version with frame analysis support.

### **Issue**: Always returns "SPOOFING_DETECTED"
**Solution**: Check lighting conditions. Ensure face is well-lit and camera is stable.

### **Issue**: BPM is always 0
**Solution**: Wait for buffer to fill (5 seconds at 30 FPS = 150 frames).

---

**🔐 Sovereign. ✅ Verified. ⚡ Biological.**

**Born in Lagos, Nigeria. Built for Truth.** 🇳🇬

