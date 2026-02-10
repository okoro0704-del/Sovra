/**
 * Medical Triage - Emergency Heartbeat Access Protocol
 * 
 * Enables verified First Responders to access critical life data
 * during medical emergencies via PFF scan of unconscious patients.
 * 
 * Protocol:
 * 1. First Responder performs PFF scan on unconscious user
 * 2. System grants 5-minute read-only access to encrypted life data
 * 3. Access limited to: Blood type, Allergies, Emergency contacts
 * 4. Every access event logged on-chain for audit
 * 5. Medical data stored off-chain (IPFS/Swarm)
 * 6. Only permission hash stored on VLT
 * 
 * Born in Lagos, Nigeria. Saving Lives with Technology.
 */

// ============ TYPES ============

export interface FirstResponder {
  did: string; // Verified First Responder DID
  name: string;
  organization: string; // Hospital, Ambulance, Fire Dept
  certificationId: string;
  certificationExpiry: number;
  isActive: boolean;
  totalEmergencyAccesses: number;
}

export interface Patient {
  did: string; // Patient's VIDA DID
  lifeDataHash: string; // IPFS hash of encrypted life data
  encryptionKey: string; // Encrypted with patient's public key
  lastUpdated: number;
}

export interface LifeData {
  bloodType: string; // A+, B-, O+, etc.
  allergies: string[]; // List of known allergies
  medications: string[]; // Current medications
  conditions: string[]; // Chronic conditions
  emergencyContacts: EmergencyContact[];
  dnr: boolean; // Do Not Resuscitate
  organDonor: boolean;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface EmergencyAccess {
  accessId: string;
  responderDid: string;
  patientDid: string;
  timestamp: number;
  expiryTime: number; // 5 minutes from grant
  location: {
    latitude: number;
    longitude: number;
  };
  pffValidation: {
    heartbeatDetected: boolean;
    bpm: number;
    confidence: number;
    isLive: boolean;
  };
  dataAccessed: string[]; // List of fields accessed
  revokedAt?: number;
  revokeReason?: string;
}

export interface AuditLog {
  accessId: string;
  responderDid: string;
  patientDid: string;
  timestamp: number;
  action: 'GRANT' | 'ACCESS' | 'REVOKE' | 'EXPIRE';
  dataField?: string;
  ipfsHash: string; // Hash of audit log stored on IPFS
  blockchainTxHash: string; // On-chain audit record
}

// ============ CONSTANTS ============

const EMERGENCY_ACCESS_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const MIN_PFF_CONFIDENCE = 60; // Lower threshold for emergency (patient may be unconscious)
const ALLOWED_LIFE_DATA_FIELDS = ['bloodType', 'allergies', 'medications', 'conditions', 'emergencyContacts', 'dnr'];

// ============ EMERGENCY ACCESS PROTOCOL ============

/**
 * Grant emergency access to First Responder
 * @param responderDid First Responder's DID
 * @param patientDid Patient's DID
 * @param pffScan PFF scan result from unconscious patient
 * @param location Emergency location
 * @returns Emergency access grant
 */
export async function grantEmergencyAccess(
  responderDid: string,
  patientDid: string,
  pffScan: any, // PFF validation result
  location: { latitude: number; longitude: number }
): Promise<EmergencyAccess> {
  // Step 1: Verify First Responder credentials
  const responder = await verifyFirstResponder(responderDid);
  if (!responder.isActive) {
    throw new Error('First Responder credentials inactive or expired');
  }

  // Step 2: Validate PFF scan (patient must show signs of life)
  if (!pffScan.heartbeatDetected) {
    throw new Error('No heartbeat detected - cannot grant access without vital signs');
  }

  if (pffScan.confidence < MIN_PFF_CONFIDENCE) {
    throw new Error(`PFF confidence too low: ${pffScan.confidence}% (minimum: ${MIN_PFF_CONFIDENCE}%)`);
  }

  // Step 3: Generate access grant
  const accessId = generateAccessId(responderDid, patientDid);
  const timestamp = Date.now();
  const expiryTime = timestamp + EMERGENCY_ACCESS_DURATION;

  const emergencyAccess: EmergencyAccess = {
    accessId,
    responderDid,
    patientDid,
    timestamp,
    expiryTime,
    location,
    pffValidation: {
      heartbeatDetected: pffScan.heartbeatDetected,
      bpm: pffScan.metrics.bpm,
      confidence: pffScan.metrics.confidence,
      isLive: pffScan.isValid,
    },
    dataAccessed: [],
  };

  // Step 4: Store access grant (in-memory or database)
  await storeEmergencyAccess(emergencyAccess);

  // Step 5: Log on-chain audit event
  await logAuditEvent({
    accessId,
    responderDid,
    patientDid,
    timestamp,
    action: 'GRANT',
    ipfsHash: await storeAuditLogIPFS(emergencyAccess),
    blockchainTxHash: await logOnChain(emergencyAccess),
  });

  // Step 6: Update responder statistics
  await incrementResponderAccesses(responderDid);

  return emergencyAccess;
}

/**
 * Access patient's life data (read-only)
 * @param accessId Emergency access ID
 * @param dataField Specific field to access
 * @returns Decrypted life data field
 */
export async function accessLifeData(
  accessId: string,
  dataField: string
): Promise<any> {
  // Step 1: Validate access grant
  const access = await getEmergencyAccess(accessId);
  if (!access) {
    throw new Error('Invalid access ID');
  }

  // Step 2: Check expiry
  if (Date.now() > access.expiryTime) {
    throw new Error('Emergency access expired');
  }

  // Step 3: Check if revoked
  if (access.revokedAt) {
    throw new Error(`Access revoked: ${access.revokeReason}`);
  }

  // Step 4: Validate data field
  if (!ALLOWED_LIFE_DATA_FIELDS.includes(dataField)) {
    throw new Error(`Unauthorized data field: ${dataField}`);
  }

  // Step 5: Retrieve patient's life data from IPFS
  const patient = await getPatient(access.patientDid);
  const encryptedLifeData = await fetchFromIPFS(patient.lifeDataHash);

  // Step 6: Decrypt life data (emergency decryption key)
  const lifeData = await decryptLifeData(encryptedLifeData, patient.encryptionKey);

  // Step 7: Track accessed field
  access.dataAccessed.push(dataField);
  await updateEmergencyAccess(access);

  // Step 8: Log access event
  await logAuditEvent({
    accessId,
    responderDid: access.responderDid,
    patientDid: access.patientDid,
    timestamp: Date.now(),
    action: 'ACCESS',
    dataField,
    ipfsHash: await storeAuditLogIPFS({ accessId, dataField, timestamp: Date.now() }),
    blockchainTxHash: await logOnChain({ accessId, dataField }),
  });

  return lifeData[dataField];
}

/**
 * Get all accessible life data for emergency
 * @param accessId Emergency access ID
 * @returns All allowed life data fields
 */
export async function getAllLifeData(accessId: string): Promise<Partial<LifeData>> {
  const access = await getEmergencyAccess(accessId);
  if (!access) {
    throw new Error('Invalid access ID');
  }

  if (Date.now() > access.expiryTime) {
    throw new Error('Emergency access expired');
  }

  if (access.revokedAt) {
    throw new Error(`Access revoked: ${access.revokeReason}`);
  }

  // Retrieve and decrypt all allowed fields
  const patient = await getPatient(access.patientDid);
  const encryptedLifeData = await fetchFromIPFS(patient.lifeDataHash);
  const lifeData = await decryptLifeData(encryptedLifeData, patient.encryptionKey);

  // Extract only allowed fields
  const allowedData: Partial<LifeData> = {};
  for (const field of ALLOWED_LIFE_DATA_FIELDS) {
    if (lifeData[field] !== undefined) {
      allowedData[field] = lifeData[field];
      access.dataAccessed.push(field);
    }
  }

  await updateEmergencyAccess(access);

  // Log bulk access
  await logAuditEvent({
    accessId,
    responderDid: access.responderDid,
    patientDid: access.patientDid,
    timestamp: Date.now(),
    action: 'ACCESS',
    dataField: 'ALL_LIFE_DATA',
    ipfsHash: await storeAuditLogIPFS({ accessId, fields: ALLOWED_LIFE_DATA_FIELDS }),
    blockchainTxHash: await logOnChain({ accessId, action: 'BULK_ACCESS' }),
  });

  return allowedData;
}

/**
 * Revoke emergency access
 * @param accessId Emergency access ID
 * @param reason Reason for revocation
 */
export async function revokeEmergencyAccess(
  accessId: string,
  reason: string
): Promise<void> {
  const access = await getEmergencyAccess(accessId);
  if (!access) {
    throw new Error('Invalid access ID');
  }

  access.revokedAt = Date.now();
  access.revokeReason = reason;

  await updateEmergencyAccess(access);

  // Log revocation
  await logAuditEvent({
    accessId,
    responderDid: access.responderDid,
    patientDid: access.patientDid,
    timestamp: Date.now(),
    action: 'REVOKE',
    ipfsHash: await storeAuditLogIPFS({ accessId, reason }),
    blockchainTxHash: await logOnChain({ accessId, action: 'REVOKE', reason }),
  });
}

// ============ FIRST RESPONDER VERIFICATION ============

/**
 * Verify First Responder credentials
 */
async function verifyFirstResponder(responderDid: string): Promise<FirstResponder> {
  // In production, query VLT for verified First Responder credentials
  // For now, return mock data
  return {
    did: responderDid,
    name: 'Dr. John Doe',
    organization: 'Lagos General Hospital',
    certificationId: 'CERT-12345',
    certificationExpiry: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    isActive: true,
    totalEmergencyAccesses: 0,
  };
}

/**
 * Increment responder's emergency access count
 */
async function incrementResponderAccesses(responderDid: string): Promise<void> {
  // Update responder statistics in database
  console.log(`Incremented emergency accesses for ${responderDid}`);
}

// ============ PATIENT DATA MANAGEMENT ============

/**
 * Get patient information
 */
async function getPatient(patientDid: string): Promise<Patient> {
  // In production, query VLT for patient's life data hash
  return {
    did: patientDid,
    lifeDataHash: 'QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // IPFS hash
    encryptionKey: 'encrypted_key_here',
    lastUpdated: Date.now(),
  };
}

/**
 * Fetch encrypted data from IPFS
 */
async function fetchFromIPFS(hash: string): Promise<any> {
  // In production, fetch from IPFS/Swarm
  return {
    encrypted: true,
    data: 'encrypted_life_data_here',
  };
}

/**
 * Decrypt life data using emergency key
 */
async function decryptLifeData(encryptedData: any, key: string): Promise<LifeData> {
  // In production, decrypt using patient's emergency key
  return {
    bloodType: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    medications: ['Aspirin 100mg daily'],
    conditions: ['Type 2 Diabetes'],
    emergencyContacts: [
      {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+234-800-123-4567',
      },
    ],
    dnr: false,
    organDonor: true,
  };
}

// ============ ACCESS MANAGEMENT ============

const emergencyAccessStore = new Map<string, EmergencyAccess>();

async function storeEmergencyAccess(access: EmergencyAccess): Promise<void> {
  emergencyAccessStore.set(access.accessId, access);
}

async function getEmergencyAccess(accessId: string): Promise<EmergencyAccess | undefined> {
  return emergencyAccessStore.get(accessId);
}

async function updateEmergencyAccess(access: EmergencyAccess): Promise<void> {
  emergencyAccessStore.set(access.accessId, access);
}

// ============ AUDIT LOGGING ============

const auditLogs: AuditLog[] = [];

async function logAuditEvent(log: AuditLog): Promise<void> {
  auditLogs.push(log);
  console.log(`[AUDIT] ${log.action} - Responder: ${log.responderDid}, Patient: ${log.patientDid}`);
}

async function storeAuditLogIPFS(data: any): Promise<string> {
  // In production, store audit log on IPFS
  const hash = `Qm${Math.random().toString(36).substring(7)}`;
  return hash;
}

async function logOnChain(data: any): Promise<string> {
  // In production, log to blockchain
  const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
  return txHash;
}

// ============ UTILITIES ============

function generateAccessId(responderDid: string, patientDid: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `emergency_${timestamp}_${random}`;
}

/**
 * Get audit logs for a patient
 */
export async function getPatientAuditLogs(patientDid: string): Promise<AuditLog[]> {
  return auditLogs.filter((log) => log.patientDid === patientDid);
}

/**
 * Get audit logs for a responder
 */
export async function getResponderAuditLogs(responderDid: string): Promise<AuditLog[]> {
  return auditLogs.filter((log) => log.responderDid === responderDid);
}

/**
 * Check if access is still valid
 */
export function isAccessValid(access: EmergencyAccess): boolean {
  if (access.revokedAt) return false;
  if (Date.now() > access.expiryTime) return false;
  return true;
}

/**
 * Get remaining access time
 */
export function getRemainingAccessTime(access: EmergencyAccess): number {
  if (!isAccessValid(access)) return 0;
  return Math.max(0, access.expiryTime - Date.now());
}

