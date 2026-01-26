# SOVRN Protocol - National Spoke Template

## 🏛️ For National Governments

This is the **reference implementation** for national governments to deploy their own SOVRN spoke with complete **data sovereignty**. Your citizen data never leaves your jurisdiction and remains under your full control.

---

## 🎯 What is a SOVRN Spoke?

A SOVRN Spoke is a **national node** in the SOVRN Protocol network that:

1. **Stores citizen data locally** with encryption (data sovereignty)
2. **Connects to the Global Hub** for cross-border verification
3. **Distributes integrity dividends** to citizens who participate
4. **Maintains full control** over national identity infrastructure

---

## 🔐 Core Principles

### 1. Data Sovereignty
- **All citizen data stays within your borders**
- Encrypted at rest using AES-256-GCM
- Only hashed biometric data stored (no plaintext PII)
- Government maintains full database control

### 2. Privacy-Preserving Verification
- Hub asks: "Does this hash exist?" (Zero-Knowledge Proof)
- Spoke responds: "Yes/No" + aggregated trust indicators
- **ZERO personal information transmitted**
- No names, passports, or PII ever leave the spoke

### 3. Integrity Dividend Economics
- Spoke receives **50% of verification fees** from Global Hub
- Fees distributed **proportionally to all active citizens**
- Citizens earn passive income for participating
- Daily automated payouts

---

## 📁 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOVRN Global Hub                             │
│                  (Protocol Coordinator)                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Encrypted Communication
                            │ (Ed25519 Signatures)
                            │
┌─────────────────────────────────────────────────────────────────┐
│                  National Spoke (Your Country)                  │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Hub-Connector   │  │ Sovereign Store  │  │  Integrity   │ │
│  │    Gateway       │  │  (Encrypted DB)  │  │   Dividend   │ │
│  │                  │  │                  │  │    Engine    │ │
│  │ - Signature      │  │ - AES-256-GCM    │  │              │ │
│  │   Verification   │  │ - SQLite         │  │ - Daily      │ │
│  │ - Replay         │  │ - Audit Log      │  │   Payouts    │ │
│  │   Prevention     │  │ - Data Export    │  │ - Fair       │ │
│  │                  │  │                  │  │   Distribution│ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
│  Data Location: YOUR COUNTRY (Never Leaves)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **SQLite** (included)
- **Linux/Unix** server (recommended)

### Step 1: Clone and Install

```bash
# Clone the template
cp -r spokes/template spokes/your-country

# Navigate to your spoke
cd spokes/your-country

# Install dependencies
npm install
```

### Step 2: Generate Cryptographic Keys

```bash
# Generate spoke identity keys and encryption keys
npm run generate:keys
```

This will output:
- `SPOKE_PRIVATE_KEY` - Your spoke's private key (KEEP SECRET!)
- `SPOKE_PUBLIC_KEY` - Your spoke's public key (share with SOVRN Hub)
- `DATABASE_ENCRYPTION_KEY` - Database encryption key (KEEP SECRET!)
- `JWT_SECRET` - JWT authentication secret (KEEP SECRET!)

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Configuration:**

```env
# National Identity
SPOKE_ID=your-country
SPOKE_NAME="Your Country National Spoke"
COUNTRY_CODE=YC
COUNTRY_NAME="Your Country"

# Cryptographic Keys (from Step 2)
SPOKE_PRIVATE_KEY=<your_generated_private_key>
SPOKE_PUBLIC_KEY=<your_generated_public_key>
DATABASE_ENCRYPTION_KEY=<your_generated_encryption_key>

# Global Hub Connection
GLOBAL_HUB_PUBLIC_KEY=<provided_by_sovrn_protocol>
GLOBAL_HUB_ENDPOINT=https://hub.sovrn-protocol.org

# Database
DATABASE_PATH=./data/sovereign.db

# Integrity Dividend
INTEGRITY_PAYOUT_ENABLED=true
INTEGRITY_PAYOUT_SCHEDULE="0 0 * * *"  # Daily at midnight
```

### Step 4: Register with SOVRN Global Hub

```bash
# Send your SPOKE_PUBLIC_KEY to SOVRN Protocol
# Email: onboarding@sovrn-protocol.org
# Include:
# - Country name
# - SPOKE_PUBLIC_KEY
# - Technical contact email
# - Deployment timeline
```

### Step 5: Start the Spoke

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

Your spoke is now running on `http://localhost:3000`!

---

## 📊 Integrity Dividend System

### How It Works

1. **Citizens get verified** at airports, hospitals, etc.
2. **Carriers pay 1 SOV** per verification to Global Hub
3. **Hub sends 50%** of fees to your National Spoke
4. **Spoke distributes fees** proportionally to all active citizens
5. **Citizens earn passive income** for participating

### Distribution Formula

```
Citizen Payout = (Citizen Verifications / Total Verifications) × Total Fees
```

**Example:**

```
Period: 2026-01-26
Total Fees Received: 1,000,000 uSOV (1,000 SOV)
Total Verifications: 10,000

Citizen A: 100 verifications
Citizen A Payout: (100 / 10,000) × 1,000,000 = 10,000 uSOV (10 SOV)

Citizen B: 50 verifications
Citizen B Payout: (50 / 10,000) × 1,000,000 = 5,000 uSOV (5 SOV)
```

### Manual Payout Execution

```bash
# Run payout for today
npm run integrity:payout

# Run payout for specific date
npm run integrity:payout 2026-01-26
```

### Automated Daily Payouts

Payouts run automatically based on `INTEGRITY_PAYOUT_SCHEDULE`:

```env
# Daily at midnight
INTEGRITY_PAYOUT_SCHEDULE="0 0 * * *"

# Every 6 hours
INTEGRITY_PAYOUT_SCHEDULE="0 */6 * * *"

# Weekly on Sunday at midnight
INTEGRITY_PAYOUT_SCHEDULE="0 0 * * 0"
```

---

## 🔒 Security Features

### 1. Hub-Connector Gateway

**Only accepts requests from Global Hub:**
- Ed25519 signature verification
- Timestamp validation (±5 minutes)
- Nonce-based replay attack prevention
- Rate limiting per request type

### 2. Data Encryption

**All citizen data encrypted at rest:**
- AES-256-GCM encryption
- Unique IV per record
- PBKDF2 key derivation
- Authentication tags for integrity

### 3. Audit Logging

**Complete audit trail:**
- All data access logged
- Immutable audit log
- Compliance-ready
- GDPR/CCPA compatible

---

## 🗄️ Database Schema

### Citizenship Records

```sql
CREATE TABLE citizenship_records (
  did TEXT PRIMARY KEY,                -- Decentralized Identifier
  biometric_hash TEXT NOT NULL UNIQUE, -- Hashed biometric (NO plaintext)
  citizenship_proof_hash TEXT NOT NULL,-- Hash of citizenship documents
  registration_date TEXT NOT NULL,
  last_verified TEXT NOT NULL,
  verification_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',        -- active, suspended, revoked
  encrypted_metadata TEXT,             -- Encrypted additional data
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Payout Periods

```sql
CREATE TABLE payout_periods (
  period_id TEXT PRIMARY KEY,          -- YYYY-MM-DD
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_fees_received INTEGER DEFAULT 0,
  total_verifications INTEGER DEFAULT 0,
  total_citizens INTEGER DEFAULT 0,
  payout_per_verification INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',       -- pending, calculated, distributed
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Citizen Payouts

```sql
CREATE TABLE citizen_payouts (
  payout_id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL,
  did TEXT NOT NULL,
  verification_count INTEGER NOT NULL,
  payout_amount INTEGER NOT NULL,      -- uSOV
  status TEXT DEFAULT 'pending',       -- pending, distributed, failed
  distributed_at TEXT,
  transaction_hash TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🌐 Deploying as a Private Side-Chain

For maximum sovereignty and performance, deploy your spoke as a **private Cosmos SDK blockchain**.

### Why Private Side-Chain?

1. **Complete Control**: Your blockchain, your rules
2. **High Performance**: Optimized for your national needs
3. **Immutable Audit Trail**: All transactions on-chain
4. **Token Integration**: Native SOV token support
5. **Interoperability**: Connect to SOVRN Hub via IBC

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              SOVRN Global Hub (Cosmos SDK)                  │
│                    Chain ID: sovrn-hub-1                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ IBC (Inter-Blockchain Communication)
                            │
┌─────────────────────────────────────────────────────────────┐
│         Your National Spoke (Private Cosmos Chain)          │
│              Chain ID: sovrn-spoke-yourcountry-1            │
│                                                             │
│  Validators: Government-Controlled                          │
│  Consensus: Tendermint BFT                                  │
│  Modules:                                                   │
│    - x/auth (Authentication)                                │
│    - x/bank (Token Transfers)                               │
│    - x/staking (Validator Management)                       │
│    - x/pff (PFF Verification)                               │
│    - x/integrity (Dividend Distribution)                    │
│    - x/sovereignty (Data Sovereignty)                       │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step Deployment

#### 1. Install Cosmos SDK

```bash
# Install Go 1.21+
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# Clone Cosmos SDK
git clone https://github.com/cosmos/cosmos-sdk.git
cd cosmos-sdk
git checkout v0.50.0
```

#### 2. Initialize Your Chain

```bash
# Set chain ID
export CHAIN_ID="sovrn-spoke-yourcountry-1"
export MONIKER="YourCountry-Validator-1"

# Initialize chain
./build/simd init $MONIKER --chain-id $CHAIN_ID

# Create validator key
./build/simd keys add validator

# Add genesis account
./build/simd genesis add-genesis-account validator 1000000000000usov

# Create genesis transaction
./build/simd genesis gentx validator 100000000000usov \
  --chain-id $CHAIN_ID \
  --moniker $MONIKER \
  --commission-rate 0.10 \
  --commission-max-rate 0.20 \
  --commission-max-change-rate 0.01

# Collect genesis transactions
./build/simd genesis collect-gentxs
```

#### 3. Configure Genesis

Edit `~/.simapp/config/genesis.json`:

```json
{
  "app_state": {
    "sovereignty": {
      "params": {
        "spoke_id": "yourcountry",
        "country_code": "YC",
        "encryption_enabled": true
      }
    },
    "integrity": {
      "params": {
        "payout_enabled": true,
        "payout_percentage": 50,
        "min_verifications": 1
      }
    },
    "pff": {
      "params": {
        "verification_cost": "5000000",
        "liveness_required": true
      }
    }
  }
}
```

#### 4. Start Validator

```bash
# Start the chain
./build/simd start \
  --rpc.laddr tcp://0.0.0.0:26657 \
  --api.enable \
  --api.address tcp://0.0.0.0:1317 \
  --grpc.address 0.0.0.0:9090
```

#### 5. Connect to Global Hub via IBC

```bash
# Create IBC connection
./build/simd tx ibc channel open-init transfer \
  --source-port transfer \
  --source-channel channel-0 \
  --counterparty-port transfer \
  --counterparty-channel channel-0 \
  --connection-id connection-0 \
  --from validator \
  --chain-id $CHAIN_ID

# Verify connection
./build/simd query ibc channel channels
```

### Validator Configuration

**Recommended Setup:**

- **Validators**: 3-7 government-controlled nodes
- **Consensus**: Tendermint BFT (Byzantine Fault Tolerant)
- **Block Time**: 5 seconds
- **Finality**: Instant (no forks)

**Hardware Requirements:**

- **CPU**: 8 cores
- **RAM**: 32 GB
- **Storage**: 1 TB SSD
- **Network**: 100 Mbps

### Monitoring

```bash
# Prometheus metrics
curl http://localhost:26660/metrics

# Node status
./build/simd status

# Validator info
./build/simd query staking validator <validator_address>
```

---

## 📡 API Endpoints

### Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "spoke_id": "yourcountry",
  "timestamp": "2026-01-26T12:00:00Z",
  "stats": {
    "total_citizens": 1000000,
    "active_citizens": 950000,
    "total_verifications": 5000000
  }
}
```

---

## 📞 Support

### Technical Support

- **Email**: support@sovrn-protocol.org
- **Documentation**: https://docs.sovrn-protocol.org
- **GitHub**: https://github.com/sovrn-protocol/sovrn

### Government Onboarding

- **Email**: onboarding@sovrn-protocol.org
- **Schedule Call**: https://calendly.com/sovrn-protocol

### Security Issues

- **Email**: security@sovrn-protocol.org
- **PGP Key**: https://sovrn-protocol.org/pgp-key.asc

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built with:
- **Cosmos SDK** - Blockchain framework
- **Tendermint** - Byzantine Fault Tolerant consensus
- **NaCl** - Cryptographic library
- **SQLite** - Embedded database

---

**Version**: 1.0.0
**Status**: ✅ Production Ready
**Last Updated**: 2026-01-26

---

**🏛️ Sovereignty. 🔐 Privacy. 💰 Prosperity.**
