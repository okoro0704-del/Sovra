# SOVRA Hub - Blockchain Tokenomics
## Unified Presence & Sovereignty Protocol

## Overview

The **SOVRA Hub** is a Cosmos SDK blockchain that implements the core tokenomics for the **SOVRA Protocol** (Sovereign Presence Architecture). It features **usage-based minting**, a **burn engine** for fee distribution, and a **hardcoded oracle peg** for verification pricing.

## Architecture

```
SOVRA Hub Blockchain (Cosmos SDK)
├── x/mint          # Usage-based minting module
├── x/auth          # Fee handling with burn engine
├── x/pff           # PFF verification module
└── x/oracle        # Price oracle module
```

## Core Tokenomics

### 1. Usage-Based Minting

**Traditional Blockchain**: Fixed inflation (e.g., 7% annual inflation)
**SOVRA Hub**: Usage-based minting (tokens minted per verification event)

#### Implementation

**Module**: `x/mint`
**Function**: `MintOnVerification(ctx sdk.Context, recipient sdk.AccAddress) error`

**Minting Logic**:
- **Trigger**: Every successful `MsgPFFVerification` transaction
- **Amount**: 10 uSOV (0.00001 SOV)
- **Recipient**: Citizen who completed the verification
- **Fixed Inflation**: DISABLED

**Parameters** (`x/mint/types/params.go`):
```go
type Params struct {
    UsageBasedMinting   bool    // true (enabled)
    MintPerVerification sdk.Int // 10 uSOV
}
```

**Example**:
```
Citizen completes PFF verification
→ MsgPFFVerification processed
→ MintOnVerification() called
→ 10 uSOV minted to citizen's account
→ Event emitted: mint_on_verification
```

### 2. The Burn Engine

**Purpose**: Distribute verification fees to create deflationary pressure and fund protocol operations

**Module**: `x/auth/ante`
**Handler**: `BurnEngineDecorator` (post-handler)

#### Fee Distribution

For every verification fee collected (5 SOV = 5,000,000 uSOV):

| Allocation | Percentage | Amount (uSOV) | Destination |
|------------|------------|---------------|-------------|
| **Burn** | 25% | 1,250,000 | Null address (removed from supply) |
| **National Spoke Pool** | 50% | 2,500,000 | DID-based routing |
| **Global Protocol Treasury** | 25% | 1,250,000 | Protocol operations |

#### Implementation

**Post-Handler Flow**:
```
1. Transaction completes successfully
2. Check if MsgPFFVerification
3. Extract fees from transaction
4. Calculate distribution:
   - burnAmount = fees × 25%
   - spokeAmount = fees × 50%
   - treasuryAmount = fees × 25%
5. Execute distribution:
   - Burn 25% (BurnCoins)
   - Send 50% to National_Spoke_Pool (DID-based)
   - Send 25% to Global_Protocol_Treasury
6. Emit fee_distribution event
```

**Code** (`x/auth/ante/fee_handler.go`):
```go
func (bed BurnEngineDecorator) distributeFees(ctx sdk.Context, fees sdk.Coins, requesterDID string) error {
    // Calculate 25% burn
    burnAmount := totalAmount.MulRaw(25).QuoRaw(100)
    bed.bankKeeper.BurnCoins(ctx, types.FeeCollectorName, burnCoins)
    
    // Calculate 50% to National_Spoke_Pool
    spokeAmount := totalAmount.MulRaw(50).QuoRaw(100)
    spokePoolName := getSpokePoolFromDID(requesterDID)
    bed.bankKeeper.SendCoinsFromModuleToModule(ctx, types.FeeCollectorName, spokePoolName, spokeCoins)
    
    // Calculate 25% to Global_Protocol_Treasury
    treasuryAmount := totalAmount.MulRaw(25).QuoRaw(100)
    bed.bankKeeper.SendCoinsFromModuleToModule(ctx, types.FeeCollectorName, "global_protocol_treasury", treasuryCoins)
}
```

### 3. The Oracle Peg

**Purpose**: Ensure predictable verification costs (will be made dynamic later)

**Module**: `x/oracle`
**Function**: `GetVerificationPrice(ctx sdk.Context) sdk.Coin`

#### Hardcoded Price

**1 Verification = 5 SOV = 5,000,000 uSOV**

**Implementation** (`x/oracle/keeper/keeper.go`):
```go
func (k Keeper) GetVerificationPrice(ctx sdk.Context) sdk.Coin {
    // HARDCODED: 1 verification = 5 SOV = 5,000,000 uSOV
    return sdk.NewCoin("usov", sdk.NewInt(5000000))
}
```

**Validation**:
```go
func (k Keeper) ValidateVerificationFee(ctx sdk.Context, fee sdk.Coins) error {
    requiredPrice := k.GetVerificationPrice(ctx) // 5,000,000 uSOV
    feeAmount := fee.AmountOf("usov")
    
    if feeAmount.LT(requiredPrice.Amount) {
        return ErrInsufficientVerificationFee
    }
    
    return nil
}
```

### 4. DID Prefix Routing

**Purpose**: Route 50% of fees to the correct National_Spoke_Pool based on requester's jurisdiction

**DID Format**: `did:sovrn:{country}:{identifier}`

**Examples**:
- `did:sovrn:nigeria:airport_security_001` → `spoke_pool_nigeria`
- `did:sovrn:kenya:border_control_005` → `spoke_pool_kenya`
- `did:sovrn:ghana:hospital_emergency_002` → `spoke_pool_ghana`

**Implementation** (`x/pff/types/did.go`):
```go
// Parse DID to extract country
func ParseDIDCountry(did string) (string, error) {
    parts := strings.Split(did, ":")
    // did:sovrn:nigeria:airport_security_001
    // [0]  [1]   [2]     [3]
    return parts[2], nil // "nigeria"
}

// Get spoke pool module account name
func GetSpokePoolAddress(country string) string {
    return fmt.Sprintf("spoke_pool_%s", country)
    // "spoke_pool_nigeria"
}
```

## Token Economics Flow

### Complete Verification Flow

```
1. Citizen initiates verification
   ├─ Pays fee: 5 SOV (5,000,000 uSOV)
   └─ Submits MsgPFFVerification with DID

2. Oracle validates fee
   ├─ Required: 5,000,000 uSOV
   └─ Actual: 5,000,000 uSOV ✓

3. PFF module processes verification
   ├─ Validate PFF hash
   ├─ Validate liveness data
   └─ Store verification record

4. Mint module mints tokens
   ├─ Amount: 10 uSOV
   └─ Recipient: Citizen

5. Burn engine distributes fees
   ├─ Burn: 1,250,000 uSOV (25%)
   ├─ National_Spoke_Pool: 2,500,000 uSOV (50%)
   └─ Global_Protocol_Treasury: 1,250,000 uSOV (25%)

6. Events emitted
   ├─ pff_verification
   ├─ mint_on_verification
   └─ fee_distribution
```

### Net Token Flow

**Per Verification**:
- **Minted**: 10 uSOV (to citizen)
- **Burned**: 1,250,000 uSOV (25% of 5 SOV fee)
- **Net Supply Change**: -1,249,990 uSOV (deflationary!)

**Economic Impact**:
- Citizens earn 10 uSOV per verification
- 25% of fees burned (deflationary pressure)
- 50% funds national operations
- 25% funds global protocol development

## Module Accounts

The blockchain uses the following module accounts:

| Module Account | Purpose |
|----------------|---------|
| `mint` | Temporary holding for newly minted tokens |
| `fee_collector` | Collects transaction fees before distribution |
| `spoke_pool_nigeria` | Nigerian national operations fund |
| `spoke_pool_kenya` | Kenyan national operations fund |
| `spoke_pool_ghana` | Ghanaian national operations fund |
| `global_protocol_treasury` | Global protocol development fund |

## Token Denominations

| Unit | Value | Use Case |
|------|-------|----------|
| **SOV** | 1,000,000 uSOV | User-facing denomination |
| **uSOV** | 0.000001 SOV | Blockchain base denomination |

**Examples**:
- 1 SOV = 1,000,000 uSOV
- 5 SOV = 5,000,000 uSOV (verification fee)
- 10 uSOV = 0.00001 SOV (minting reward)

## Comparison: Traditional vs SOVRN

| Feature | Traditional Blockchain | SOVRN Hub |
|---------|----------------------|-----------|
| **Minting** | Fixed inflation (7% annual) | Usage-based (10 uSOV per verification) |
| **Fee Burning** | None or minimal | 25% of all fees |
| **Fee Distribution** | Validators only | 25% burn, 50% spoke, 25% treasury |
| **Price Oracle** | Market-driven | Hardcoded 5 SOV (temporary) |
| **Supply Growth** | Time-based | Activity-based |

## Implementation Files

### x/mint Module

**`x/mint/types/params.go`**:
- Defines `Params` struct with `UsageBasedMinting` and `MintPerVerification`
- Default: `UsageBasedMinting = true`, `MintPerVerification = 10 uSOV`
- Validation functions for parameters

**`x/mint/keeper/keeper.go`**:
- `MintOnVerification()` - Core minting function
- Mints 10 uSOV to citizen on successful verification
- Emits `mint_on_verification` event

**`x/mint/types/events.go`**:
- Event types and attribute keys

**`x/mint/types/expected_keepers.go`**:
- Interface definitions for bank and account keepers

**`x/mint/types/keys.go`**:
- Module name, store key, router key constants

**`x/mint/types/minting.go`**:
- `MintingStats` struct for querying minting statistics

### x/pff Module

**`x/pff/types/msgs.go`**:
- `MsgPFFVerification` - Message type for PFF verification
- Fields: `Citizen`, `PFFHash`, `RequesterDID`, `LivenessData`, `Context`
- `VerificationRecord` - Stores verification events

**`x/pff/keeper/keeper.go`**:
- `ProcessPFFVerification()` - Main verification logic
- Validates PFF hash and liveness data
- Calls `MintOnVerification()` on success
- Stores verification record

**`x/pff/types/did.go`**:
- `ValidateDID()` - Validates DID format
- `ParseDIDCountry()` - Extracts country from DID
- `GetSpokePoolAddress()` - Returns spoke pool module account name

**`x/pff/types/keys.go`**:
- Module constants and event types

**`x/pff/types/codec.go`**:
- Message registration for encoding/decoding

**`x/pff/types/expected_keepers.go`**:
- Interface definitions for mint and oracle keepers

### x/oracle Module

**`x/oracle/keeper/keeper.go`**:
- `GetVerificationPrice()` - Returns hardcoded 5 SOV price
- `ValidateVerificationFee()` - Validates transaction fee

**`x/oracle/types/keys.go`**:
- Module constants

**`x/oracle/types/errors.go`**:
- `ErrInsufficientVerificationFee` - Error for insufficient fees

### x/auth Module

**`x/auth/ante/fee_handler.go`**:
- `BurnEngineDecorator` - Post-handler for fee distribution
- `distributeFees()` - Implements 25/50/25 distribution
- `getSpokePoolFromDID()` - DID-based routing logic

## Usage Examples

### 1. Submit PFF Verification

```bash
# Create and sign MsgPFFVerification
sovd tx pff verify \
  --citizen=sovrn1abc123... \
  --pff-hash=hashed_fingerprint_data \
  --requester-did=did:sovrn:nigeria:airport_security_001 \
  --liveness-data='{"motion_detected":true,"depth_sensor":true}' \
  --context=airport_security \
  --fees=5000000usov \
  --from=citizen_key \
  --chain-id=sovrn-hub-1
```

### 2. Query Minting Stats

```bash
# Query current minting parameters and statistics
sovd query mint stats

# Output:
# {
#   "total_supply": "1000000000",
#   "usage_based_minting": true,
#   "mint_per_verification": "10"
# }
```

### 3. Query Verification Price

```bash
# Query current verification price from oracle
sovd query oracle verification-price

# Output:
# {
#   "denom": "usov",
#   "amount": "5000000"
# }
```

### 4. Query Verification Record

```bash
# Query a specific verification record
sovd query pff verification \
  --citizen=sovrn1abc123... \
  --block-height=12345

# Output:
# {
#   "citizen": "sovrn1abc123...",
#   "pff_hash": "hashed_fingerprint_data",
#   "requester_did": "did:sovrn:nigeria:airport_security_001",
#   "context": "airport_security",
#   "timestamp": 1706284800,
#   "block_height": 12345
# }
```

### 5. Query Module Account Balances

```bash
# Check National Spoke Pool balance
sovd query bank balances $(sovd keys show spoke_pool_nigeria -a)

# Check Global Protocol Treasury balance
sovd query bank balances $(sovd keys show global_protocol_treasury -a)
```

## Events

### mint_on_verification

Emitted when tokens are minted on verification:

```json
{
  "type": "mint_on_verification",
  "attributes": [
    {"key": "recipient", "value": "sovrn1abc123..."},
    {"key": "amount", "value": "10"},
    {"key": "module", "value": "mint"}
  ]
}
```

### pff_verification

Emitted when PFF verification is processed:

```json
{
  "type": "pff_verification",
  "attributes": [
    {"key": "citizen", "value": "sovrn1abc123..."},
    {"key": "pff_hash", "value": "hashed_fingerprint_data"},
    {"key": "requester_did", "value": "did:sovrn:nigeria:airport_security_001"},
    {"key": "context", "value": "airport_security"},
    {"key": "success", "value": "true"}
  ]
}
```

### fee_distribution

Emitted when fees are distributed by burn engine:

```json
{
  "type": "fee_distribution",
  "attributes": [
    {"key": "total_amount", "value": "5000000"},
    {"key": "burned", "value": "1250000"},
    {"key": "spoke_pool", "value": "2500000"},
    {"key": "spoke_pool_name", "value": "spoke_pool_nigeria"},
    {"key": "treasury", "value": "1250000"}
  ]
}
```

## Security Considerations

### 1. Fee Validation

The oracle module validates that every `MsgPFFVerification` includes exactly 5 SOV (5,000,000 uSOV) in fees. Transactions with insufficient fees are rejected.

### 2. DID Validation

All DIDs are validated to ensure proper format (`did:sovrn:{country}:{identifier}`). Invalid DIDs cause transaction failure.

### 3. Liveness Detection

The PFF module validates liveness data to prevent spoofing attacks. In production, this should include:
- Motion detection
- Depth sensor validation
- Temperature checks
- Blink detection

### 4. Module Account Security

Module accounts (`spoke_pool_*`, `global_protocol_treasury`) are controlled by the blockchain and cannot be accessed by external keys.

## Future Enhancements

### 1. Dynamic Oracle

Replace hardcoded 5 SOV price with dynamic oracle based on:
- Market conditions
- Network congestion
- Verification demand
- Token supply

### 2. Governance

Add governance module to allow:
- Adjusting `MintPerVerification` parameter
- Changing fee distribution percentages
- Adding new spoke pools
- Updating oracle price

### 3. Cross-Chain Integration

Enable cross-chain verification:
- IBC (Inter-Blockchain Communication) support
- Cross-spoke verification
- Global trust score synchronization

### 4. Advanced Tokenomics

Implement additional features:
- Staking rewards for validators
- Slashing for malicious behavior
- Token vesting for early adopters
- Liquidity mining programs

## Development Setup

### Prerequisites

```bash
# Install Go 1.21+
go version

# Install Cosmos SDK dependencies
go get github.com/cosmos/cosmos-sdk@v0.47.0
```

### Build the Blockchain

```bash
# Navigate to chain directory
cd global-hub/chain

# Initialize go module
go mod init github.com/sovrn-protocol/sovrn

# Install dependencies
go mod tidy

# Build the blockchain daemon
make install

# Verify installation
sovd version
```

### Initialize Local Node

```bash
# Initialize node
sovd init my-node --chain-id sovrn-hub-1

# Create module accounts
sovd add-genesis-account spoke_pool_nigeria 0usov --module-account
sovd add-genesis-account spoke_pool_kenya 0usov --module-account
sovd add-genesis-account spoke_pool_ghana 0usov --module-account
sovd add-genesis-account global_protocol_treasury 0usov --module-account

# Create validator key
sovd keys add validator

# Add validator to genesis
sovd add-genesis-account $(sovd keys show validator -a) 1000000000usov

# Create genesis transaction
sovd gentx validator 100000000usov --chain-id sovrn-hub-1

# Collect genesis transactions
sovd collect-gentxs

# Start the node
sovd start
```

## Testing

### Unit Tests

```bash
# Test x/mint module
go test ./x/mint/...

# Test x/pff module
go test ./x/pff/...

# Test x/oracle module
go test ./x/oracle/...

# Test x/auth ante handler
go test ./x/auth/ante/...
```

### Integration Tests

```bash
# Run full integration test suite
make test-integration
```

### Simulation Tests

```bash
# Run blockchain simulation
make test-sim
```

## Monitoring

### Key Metrics

1. **Total Supply**: Track total uSOV in circulation
2. **Burn Rate**: Monitor tokens burned per day
3. **Verification Volume**: Count verifications per day
4. **Fee Distribution**: Track spoke pool and treasury balances
5. **Minting Events**: Count minting events per day

### Prometheus Metrics

```yaml
# Total supply
sovrn_total_supply{denom="usov"}

# Verifications per day
sovrn_verifications_total

# Tokens burned per day
sovrn_tokens_burned_total

# Spoke pool balances
sovrn_spoke_pool_balance{country="nigeria"}
sovrn_spoke_pool_balance{country="kenya"}

# Treasury balance
sovrn_treasury_balance
```

## Support

For questions or issues:
- **Documentation**: https://docs.sovrn.network
- **GitHub**: https://github.com/sovrn-protocol/sovrn
- **Discord**: https://discord.gg/sovrn
- **Email**: blockchain@sovrn.network

