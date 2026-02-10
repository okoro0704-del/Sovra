/**
 * Shared WebAuthn - credential creation and assertion interfaces.
 * Spokes use this for passkey / hardware-bound auth before sensitive ops.
 */

export interface WebAuthnCreateOptions {
  userId: string;
  userName?: string;
  rpName?: string;
}

export interface WebAuthnAssertOptions {
  challenge: string;
  allowCredentials?: Array<{ id: string; type: string }>;
}

export interface WebAuthnResult {
  success: boolean;
  credentialId?: string;
  clientDataJSON?: string;
  authenticatorData?: string;
  signature?: string;
  error?: string;
}

/**
 * Stub: WebAuthn registration (implement in spoke or auth service).
 */
export async function webauthnCreate(_options: WebAuthnCreateOptions): Promise<WebAuthnResult> {
  return {
    success: false,
    error: 'WebAuthn create not implemented in core-logic; implement in spoke or auth service',
  };
}

/**
 * Stub: WebAuthn assertion (implement in spoke or auth service).
 */
export async function webauthnAssert(_options: WebAuthnAssertOptions): Promise<WebAuthnResult> {
  return {
    success: false,
    error: 'WebAuthn assert not implemented in core-logic; implement in spoke or auth service',
  };
}
