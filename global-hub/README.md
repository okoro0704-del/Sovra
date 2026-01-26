# SOVRA Protocol - Global Hub
## Unified Presence & Sovereignty Protocol

## Overview

The **Global Hub** contains the universal, protocol-level components of the **SOVRA Protocol** (Sovereign Presence Architecture) that are shared across all geographic implementations (spokes). SOVRA combines **PFF (Presence Factor Fabric)** biometric verification with **SOVRN** decentralized identity and consent management.

## Architecture

The Global Hub is designed to be:
- **Universal**: Works across all jurisdictions and implementations
- **Extensible**: Can be customized by individual spokes
- **Secure**: Core security primitives and cryptographic utilities
- **Interoperable**: Standard interfaces for cross-spoke communication

## Structure

```
global-hub/
├── packages/
│   └── shared/           # Core TypeScript types and utilities
├── docs/                 # Protocol documentation
└── contracts/            # Smart contracts (future)
```

## Components

### `packages/shared`

Core TypeScript types and utilities used by all SOVRA implementations:

- **Types**: Standard interfaces for citizens, entities, consents, and tokens
- **Security**: Cryptographic utilities (HMAC-SHA256, hashing)
- **Validation**: Input validation and sanitization
- **Constants**: Protocol-wide constants and configurations (PROTOCOL_NAME, API_HEADERS, etc.)

## Usage

Individual spokes (geographic implementations) import from the global hub:

```typescript
import { CitizenRegistry, ConsentLog, SovTokenBalance } from '@sovrn/shared';
```

## Key Concepts

### PFF (Presence Factor Fabric)
Biometric verification system using hashed fingerprint data for identity verification.

### SOV Token
Usage-based value token minted upon PFF verification events. The token economics are defined at the protocol level but can be customized per spoke.

### Consent Management
Standardized consent logging and verification system ensuring data privacy and citizen control.

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test
```

## Contributing

The Global Hub is the foundation of the SOVRA Protocol. Changes here affect all spokes, so:

1. Ensure backward compatibility
2. Document all breaking changes
3. Follow semantic versioning
4. Write comprehensive tests

## License

MIT License - See LICENSE file for details

## Related

- [Nigerian Spoke](../spokes/nigeria/README.md) - Nigerian implementation
- [Protocol Documentation](./docs/PROTOCOL.md)
- [Token Economics](./docs/TOKEN_ECONOMICS.md)

