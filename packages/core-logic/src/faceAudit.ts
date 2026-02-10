/**
 * Shared Face Audit - verification against sovereign_identity.face_hash.
 * Spokes use this to validate face scan / liveness before minting or consent.
 */

export interface FaceAuditInput {
  faceHash: string;
  citizenUid?: string;
  sovereignIdentityId?: string;
}

export interface FaceAuditResult {
  verified: boolean;
  matchScore?: number;
  error?: string;
}

/**
 * Stub: Face Audit verification (implement in spoke or liveness service).
 * Compares provided face_hash to stored sovereign_identity.face_hash.
 */
export async function verifyFaceAudit(_input: FaceAuditInput): Promise<FaceAuditResult> {
  return {
    verified: false,
    error: 'Face Audit not implemented in core-logic; implement in spoke or liveness service',
  };
}
