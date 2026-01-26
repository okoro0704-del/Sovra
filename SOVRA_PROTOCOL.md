<!-- TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY -->
# SOVRA Protocol
## The World's First Autonomous Presence Layer

**SOVRA** (Sovereign Presence Architecture) is the world's first **Autonomous Presence Layer** — a self-regulating protocol that combines AI-powered human verification with blockchain-based sovereign identity and responsive token economics.

### The SOVRA Trinity

**SOVRA** is built on three foundational pillars:

1. **Sovereign** 🔐  
   Individual-owned data via SOVRN blockchain logic. Citizens control their identity, biometric attestations, and consent records through decentralized identifiers (DIDs) and cryptographic signatures.

2. **Verified** ✅  
   AI-Powered PFF (Presence Factor Fabric) ensures real-world human liveness. Advanced neural analysis, texture detection, and rPPG pulse verification guarantee one person = one identity.

3. **Responsive Automation** ⚡  
   Smart Contracts trigger the instant minting and burning of SOV Units based on usage. The protocol autonomously adjusts token supply in response to verification events — no human intervention required.

### The Economic Rule: "Value through Vitality"

> **"As human verification events (Vitality) increase, the circulating supply of SOV decreases (Burn), ensuring the protocol's value scales with its utility."**

**How It Works**:
- **Vitality** = Human verification events (PFF scans, consent grants, identity proofs)
- **Minting** = New SOV units created upon verification (usage-based supply growth)
- **Burning** = 25% of all transaction fees permanently destroyed (deflationary pressure)
- **Result** = Higher usage → More burns → Reduced supply → Increased scarcity → Value appreciation

Unlike traditional cryptocurrencies with fixed inflation schedules, SOVRA's value is directly tied to real-world human activity. The more people use the protocol, the more valuable each SOV unit becomes.

---

## The SOVRA Trinity in Action

### 1. Sovereign (Individual Data Ownership)
- **Decentralized Identifiers (DIDs)**: Format `did:sovra:{country}:{identifier}`
- **Self-Sovereign Identity**: Citizens own their identity, not governments or corporations
- **Cryptographic Signatures**: All consents and verifications signed with private keys
- **Data Portability**: Export and migrate identity data across jurisdictions

### 2. Verified (AI-Powered Human Liveness)
- **Neural Liveness Detection**: AI models detect screen replays, deepfakes, and spoofing
- **rPPG Pulse Detection**: Heart rate verification through camera color sensors
- **3D Depth Analysis**: TrueDepth/ToF sensors verify real 3D faces (Level 3 PFF)
- **Movement Challenges**: Random movement verification for high-risk zones
- **One Person = One Identity**: Biometric hashing ensures uniqueness

### 3. Responsive Automation (Smart Contract Economics)
- **Instant Minting**: SOV units created automatically upon verification (no manual approval)
- **Automatic Burning**: 25% of transaction fees burned instantly (deflationary pressure)
- **DID-Based Routing**: Funds automatically routed to correct National Spoke Pool
- **Oracle Peg**: Price oracle ensures stable verification costs
- **No Human Intervention**: Entire economic system runs autonomously

---

## "Value through Vitality" Economic Model

### The Vitality Equation

```
Protocol Value = f(Vitality, Burn Rate, Scarcity)

Where:
- Vitality = Total human verification events
- Burn Rate = 25% of all transaction fees
- Scarcity = Reduced circulating supply due to burns
```

### How Vitality Drives Value

1. **More Verifications** → More SOV minted (usage-based supply)
2. **More Transactions** → More fees collected
3. **More Fees** → More SOV burned (25% burn rate)
4. **More Burns** → Reduced circulating supply
5. **Reduced Supply** → Increased scarcity
6. **Increased Scarcity** → Higher value per SOV unit

### Example Scenario

**Day 1**:
- 1,000 verifications → 10,000 uSOV minted
- 500 transactions → 500 SOV in fees
- 125 SOV burned (25% of fees)
- Net supply increase: 10,000 - 125 = 9,875 uSOV

**Day 365** (High Adoption):
- 1,000,000 verifications → 10,000,000 uSOV minted
- 500,000 transactions → 500,000 SOV in fees
- 125,000 SOV burned (25% of fees)
- Net supply increase: 10,000,000 - 125,000 = 9,875,000 uSOV

**Result**: As usage grows 1000x, burn rate grows 1000x, creating deflationary pressure that increases value per unit.

---

## Architecture: Hub and Spoke Model

The SOVRA Protocol uses a **hub-and-spoke architecture** to enable global scalability while maintaining local compliance:

```
SOVRA Protocol/
├── global-hub/              # Universal protocol layer
│   ├── packages/shared/     # Core types and utilities
│   ├── chain/               # Cosmos SDK blockchain
│   ├── api/                 # Global Hub API services
│   └── docs/                # Protocol specification
│
└── spokes/                  # Geographic implementations
    ├── template/            # Reference implementation
    └── nigeria/             # Nigerian implementation
        ├── apps/            # API, Dashboard, Mobile App
        ├── supabase/        # Database schema
        └── config/          # Nigerian-specific settings
```

### Global Hub (`/global-hub`)

Contains protocol-level components shared across all implementations:
- **Core Types**: Standard interfaces for citizens, entities, consents, and tokens
- **Security Primitives**: HMAC-SHA256 hashing, cryptographic utilities
- **Token Standards**: SOV token economics and interfaces
- **Blockchain**: Cosmos SDK chain with usage-based minting and burn engine
- **Fast-Track API**: Sub-500ms verification with temporal trust cache
- **Fraud Orchestrator**: Velocity checks, hardware attestation, AI liveness scoring
- **Geofenced Security**: Location-aware step-up authentication
- **Protocol Documentation**: Specifications, API docs, token economics

See [Global Hub README](./global-hub/README.md) for details.

### Spokes (`/spokes`)

Geographic/jurisdictional implementations that customize the protocol:
- **Token Economics**: Minting rates, bonuses, rate limits
- **Regulatory Compliance**: Local data protection laws (e.g., NDPR for Nigeria)
- **Infrastructure**: Local deployment, CDN, database regions
- **User Experience**: Languages, currency display, USSD support
- **Data Sovereignty**: Private side-chain with encrypted citizen data

#### Nigerian Spoke (`/spokes/nigeria`)

The Nigerian implementation includes:
- **API Service**: Express/TypeScript Oracle backend
- **Admin Dashboard**: Next.js web portal for oversight
- **PFF Gateway**: React Native mobile app for citizens
- **Database**: Supabase PostgreSQL with Nigerian schema
- **Configuration**: NDPR compliance, NIMC integration, local languages

See [Nigerian Spoke README](./spokes/nigeria/README.md) for details.

---

## Key Features

### SOVRA_Presence_Engine (Client-Side)
- **PFF (Presence Factor Fabric)** - AI-powered biometric verification
- **Neural Liveness Detection** - Texture analysis, rPPG pulse detection, 3D depth
- **On-Device Processing** - Privacy-first NPU processing
- **Geofenced Security** - Location-aware step-up authentication (Level 1-3 PFF)
- **Movement Challenges** - Random movement verification for high-risk zones

### SOVRA_Sovereign_Kernel (Core/Hub)
- **Blockchain Tokenomics** - Usage-based minting, 25% burn, oracle peg
- **DID-Based Routing** - Automatic fund routing to National Spoke Pools
- **Fast-Track Verification** - Sub-500ms response with temporal trust cache
- **Multi-Party Settlement** - Split billing for airports, airlines, enterprises
- **Fraud Detection** - Velocity checks, impossible travel, deepfake detection
- **Watchlist Monitoring** - Encrypted alerts to security forces (AES-256-GCM)

### Protocol Features
- **Explicit Consent Management** with cryptographic signatures
- **SOV Token Economics** - "Value through Vitality" economic model
- **Hub-and-Spoke Architecture** - Global protocol, local implementation
- **Privacy by Design** - Biometric data never stored in plaintext
- **Regulatory Compliance** - Customizable per jurisdiction
- **Decentralized** - No single point of control

---

## Documentation

### Core Protocol
- [SOVRA Protocol Overview](./global-hub/docs/PROTOCOL.md)
- [Token Economics](./global-hub/docs/TOKEN_ECONOMICS.md)
- [Blockchain Tokenomics](./global-hub/docs/BLOCKCHAIN_TOKENOMICS.md)

### Security & Verification
- [PFF Neural Analyzer](./global-hub/docs/PFF_NEURAL_ANALYZER.md)
- [Fraud Orchestrator](./global-hub/docs/FRAUD_ORCHESTRATOR.md)
- [Geofenced Security Protocol](./global-hub/docs/GEOFENCED_SECURITY_PROTOCOL.md)
- [Fast-Track gRPC API](./global-hub/docs/FASTTRACK_GRPC_API.md)

### Billing & Settlement
- [Billing Gateway](./global-hub/docs/BILLING_GATEWAY.md)
- [Multi-Party Settlement](./global-hub/docs/MULTI_PARTY_SETTLEMENT.md)

---

## Getting Started

### Quick Start (Nigerian Spoke)

1. **Clone the repository**:
```bash
git clone https://github.com/your-org/sovra-protocol.git
cd sovra-protocol
```

2. **Install dependencies**:
```bash
npm install
cd global-hub && npm install && cd ..
cd spokes/nigeria && npm install && cd ../..
```

3. **Set up environment variables**:
```bash
cd spokes/nigeria
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. **Set up database**:
```bash
cd spokes/nigeria
npm run db:push
```

5. **Run the services**:
```bash
npm run dev:nigeria:api        # API on http://localhost:3000
npm run dev:nigeria:dashboard  # Dashboard on http://localhost:3001
npm run dev:nigeria:gateway    # Mobile app (Expo)
```

---

## The SOVRA Vision

**SOVRA** represents a paradigm shift in digital identity:

- **From Centralized to Sovereign**: Individuals own their data, not corporations or governments
- **From Static to Verified**: AI-powered liveness ensures real humans, not bots or deepfakes
- **From Manual to Autonomous**: Smart contracts automate token economics without human intervention
- **From Inflation to Vitality**: Value scales with real-world usage, not arbitrary schedules

### The Future of Identity

As the world's first **Autonomous Presence Layer**, SOVRA enables:

- **Universal Basic Identity**: Every human has a verified, sovereign digital identity
- **Fraud-Proof Systems**: AI liveness detection eliminates identity fraud
- **Fair Value Distribution**: "Value through Vitality" ensures users benefit from protocol growth
- **Global Interoperability**: Hub-and-spoke architecture enables cross-border identity verification
- **Privacy-First Design**: Biometric data never leaves the device, only hashes are stored

---

## License

Proprietary - SOVRA Protocol

---

**🔐 Sovereign. ✅ Verified. ⚡ Responsive.**
**The World's First Autonomous Presence Layer.**

