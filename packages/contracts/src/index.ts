/**
 * @vitalia/contracts
 *
 * SOVRYN Genesis Protocol - Blockchain & VLT Only
 *
 * "Sovereign. Verified. Biological."
 *
 * NO UI CODE. NO CAMERA DRIVERS. NO SENSOR LOGIC.
 * This package contains ONLY blockchain logic and VLT interfaces.
 *
 * Architect: ISREAL OKORO
 */

// ════════════════════════════════════════════════════════════════
// SOVEREIGN CORE - Centralized Tokenomics Engine
// ════════════════════════════════════════════════════════════════

// Note: SovereignCore.sol is a Solidity contract
// TypeScript interfaces will be generated from ABI

// ════════════════════════════════════════════════════════════════
// PFF SENTINEL BRIDGE - VALID_PRESENCE Interface
// ════════════════════════════════════════════════════════════════

export {
  validatePresenceSignal,
  processValidPresenceAndMint,
  generateValidPresenceSignal,
  clearUsedSignatures,
  getUsedSignatureCount,
} from './PFFSentinelBridge';

export type {
  ValidPresenceSignal,
  PresenceValidation,
  MintingResult,
} from './PFFSentinelBridge';

// ════════════════════════════════════════════════════════════════
// LEGACY EXPORTS (Deprecated - Use SovereignCore instead)
// ════════════════════════════════════════════════════════════════

export {
  registerUser,
  isUserRegistered,
  getUserBalance,
} from './SovereignChain';

export type {
  UserRegistration,
} from './SovereignChain';

// VIDA Cap Godcurrency exports
export {
  verifySovereignAuth,
  generateSovereignAuth,
  validatePFFCertification,
  clearUsedNonces as clearAuthNonces,
  getUsedNonceCount,
} from './PFFAuthListener';

export type {
  SovereignAuthSignature,
  PFFCertification,
  AuthValidation,
} from './PFFAuthListener';

// Agnostic Gateway exports
export {
  processPaymentFromAnyApp,
  getGatewayStats,
  isAppPFFCertified,
  createPFFCertification,
  validatePaymentRequest,
  resetGatewayStats,
} from './AgnosticGateway';

export type {
  PaymentRequest,
  PaymentResult,
  GatewayStats,
} from './AgnosticGateway';

// Universal PFF Gateway exports
export {
  generateHandshakeAuthorization,
  verifyHandshakeAuthorization,
  processPayment,
  getMerchantCertification,
  getMerchantVLTStats,
  getGlobalGatewayStats,
  isMerchantCertified,
  calculatePaymentBreakdown,
} from './UniversalPFFGateway';

export type {
  HandshakeAuthorization,
  MerchantCertification,
  VLTStats,
  GlobalGatewayStats,
} from './UniversalPFFGateway';

export {
  MedicalAuth,
  verifyHealthCover,
} from './MedicalAuth';

export type {
  CoverageStatus,
  VerificationRequest,
  VerificationResult,
  ZKProof,
} from './MedicalAuth';

export {
  checkSymptoms,
  SYMPTOMS,
  DISEASES,
} from './logic/medical/SymptomChecker';

export type {
  Symptom,
  Disease,
  DiagnosisResult,
  SymptomCheckRequest,
} from './logic/medical/SymptomChecker';

export {
  getMedicationAdvice,
} from './logic/medical/PharmacyBridge';

export type {
  Medication,
  MedicationAdvice,
  PharmacyBridgeRequest,
} from './logic/medical/PharmacyBridge';

export {
  syncToOrbitalMesh,
  SATELLITE_MESH,
} from './satellite/SSS_Sync';

export type {
  SatelliteNode,
  TruthBundle,
  SyncRequest,
  SyncResponse,
  NetworkHealth,
} from './satellite/SSS_Sync';

export {
  checkBorderCrossStatus,
  GEOFENCE_REGIONS,
} from './satellite/RefugeeRecovery';

export type {
  RefugeeStatus,
  BorderCrossAlert,
  GeofenceRegion,
} from './satellite/RefugeeRecovery';

// Global Defense DAO exports
export {
  captureWitnessEvidence,
  getEvidenceByHash,
  verifyChainOfCustody,
  CrimeType,
  VerificationStatus,
} from './TruthWitness';

export type {
  WitnessEvidence,
  ChainOfCustodyEntry,
  WitnessSubmission,
} from './TruthWitness';

// Sovryn-PFF Integration exports
export {
  SovrynClient,
  RSK_MAINNET_CONFIG,
  RSK_TESTNET_CONFIG,
} from './sovryn/SovrynClient';

export {
  generatePresenceProof,
  validatePresenceProof,
  withPresence,
  createPresenceGatedClient,
  clearUsedNonces,
  getPresenceProofExpiry,
  isPresenceProofExpired,
} from './sovryn/PresenceGate';

export type {
  SovrynConfig,
  PresenceProof,
  TradeParams,
  LoanParams,
  BorrowParams,
  SovrynBalances,
} from './sovryn/SovrynClient';

export type {
  PFFScanResult,
  PresenceValidation,
  TransactionWithPresence,
} from './sovryn/PresenceGate';

// Sovereign Session Management exports
export {
  SovereignSessionManager,
  getSovereignSessionManager,
  initializeSovereignSession,
  isSovereignVaultUnlocked,
  getCurrentSovereignSession,
} from './sovryn/SovereignSession';

export type {
  SovereignSession,
  SessionConfig,
} from './sovryn/SovereignSession';

// Transaction Interceptor exports
export {
  interceptSovrynTransaction,
  interceptSovrynTransactionSafe,
  createGatedFunction,
  GatedTransaction,
  canExecuteSovrynTransaction,
  SovereignGateError,
} from './sovryn/TransactionInterceptor';

export type {
  InterceptorResult,
} from './sovryn/TransactionInterceptor';
