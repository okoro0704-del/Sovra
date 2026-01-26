# SOVRN Protocol - Nigerian Spoke

## Overview

The **Nigerian Spoke** is the Nigerian implementation of the SOVRN Protocol, providing decentralized identity and consent management services tailored to Nigerian regulations and requirements.

## Architecture

This spoke implements the full SOVRN Protocol stack:

```
spokes/nigeria/
├── apps/
│   ├── api/                 # Oracle Service (Express/TypeScript)
│   ├── admin-dashboard/     # Admin Portal (Next.js)
│   └── pff-gateway/         # Mobile App (React Native/Expo)
├── supabase/                # Database schema and migrations
├── config/                  # Nigerian-specific configuration
└── docs/                    # Nigerian implementation docs
```

## Components

### API (Oracle Service)
RESTful API service that handles:
- PFF (biometric) verification
- Consent logging
- SOV token minting
- Entity authentication

**Tech Stack**: Node.js, Express, TypeScript, Supabase

### Admin Dashboard
Web portal for system administrators to:
- Monitor citizen registrations
- Manage registered entities
- View consent logs
- Track token minting events

**Tech Stack**: Next.js, React, TypeScript, Tailwind CSS

### PFF Gateway (Mobile App)
Mobile application for citizens to:
- Register with biometric verification
- Grant/revoke consent
- View SOV token balance
- Manage data access permissions

**Tech Stack**: React Native, Expo, TypeScript

### Database (Supabase)
PostgreSQL database with:
- Citizen registry
- Registered entities
- Consent logs
- SOV token balances and transactions

**Features**: Row Level Security (RLS), real-time subscriptions, auto-generated APIs

## Nigerian-Specific Features

### Regulatory Compliance
- **NDPR** (Nigeria Data Protection Regulation) compliance
- **NIMC** (National Identity Management Commission) integration
- **NIN** (National Identification Number) hashing and verification
- Local data residency requirements

### Token Economics
```typescript
// Nigerian minting rates
const NIGERIA_MINTING_RATES = {
  pff_verification: '1.0',      // 1 SOV per verification
  consent_granted: '1.0',       // 1 SOV per consent
  first_time_bonus: '5.0'       // 5 SOV bonus for first registration
};
```

### Language Support
- English (primary)
- Hausa
- Yoruba
- Igbo

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Expo CLI (for mobile development)

### Installation

1. **Clone and navigate to Nigerian spoke**:
```bash
cd spokes/nigeria
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. **Set up database**:
```bash
npm run db:push
```

### Development

**Run API server**:
```bash
npm run dev:api
# Server runs on http://localhost:3000
```

**Run Admin Dashboard**:
```bash
npm run dev:dashboard
# Dashboard runs on http://localhost:3001
```

**Run Mobile App**:
```bash
npm run dev:gateway
# Expo DevTools opens in browser
```

## Configuration

### Environment Variables

Create `.env` file in the Nigerian spoke root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...

# API Configuration
PORT=3000
NODE_ENV=development
API_SECRET_KEY=your-secret-key

# Token Economics
DEFAULT_MINT_AMOUNT=1.0
FIRST_TIME_BONUS=5.0
```

### Nigerian-Specific Config

See `config/nigeria.config.ts` for:
- Minting rate customization
- Regulatory compliance settings
- Language preferences
- Local infrastructure endpoints

## API Endpoints

### Verification
```
POST /v1/verify
```
Initiate PFF verification and get challenge token

### Consent
```
POST /v1/consent
```
Submit biometric signature and log consent (auto-mints SOV tokens)

### Token
```
POST /v1/token/mint
GET /v1/token/balance/:citizenId
```
Manual token minting and balance queries

## Database Schema

### Core Tables
- `citizen_registry` - Citizen identities with PFF hashes
- `registered_entities` - Organizations requesting data
- `consent_logs` - Immutable consent records
- `sov_token_balances` - Citizen token holdings
- `sov_minting_events` - Token minting history
- `sov_token_transactions` - Full transaction ledger

See `supabase/schema.sql` for complete schema.

## Deployment

### Production Checklist
- [ ] Set up production Supabase project
- [ ] Configure environment variables
- [ ] Enable RLS policies
- [ ] Set up API rate limiting
- [ ] Configure CORS for dashboard
- [ ] Deploy API to cloud provider
- [ ] Deploy dashboard to Vercel/Netlify
- [ ] Publish mobile app to stores

### Recommended Infrastructure
- **API**: Railway, Render, or AWS ECS
- **Dashboard**: Vercel or Netlify
- **Database**: Supabase (managed PostgreSQL)
- **Mobile**: Expo EAS Build & Submit

## Security

### Best Practices
- Never store biometric data in plaintext
- Use HMAC-SHA256 for all hashing
- Rotate API keys regularly
- Enable RLS on all database tables
- Use HTTPS for all API communication
- Implement rate limiting
- Monitor for suspicious activity

### Compliance
- NDPR data protection requirements
- Citizen right to erasure
- Data portability
- Consent audit trails
- Local data residency

## Support

For Nigerian spoke-specific issues:
- Email: nigeria@sovrn.protocol
- Telegram: @sovrn_nigeria
- GitHub Issues: Tag with `spoke:nigeria`

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - See LICENSE file for details

## Related Documentation

- [Global Hub](../../global-hub/README.md)
- [Protocol Specification](../../global-hub/docs/PROTOCOL.md)
- [Token Economics](../../global-hub/docs/TOKEN_ECONOMICS.md)

