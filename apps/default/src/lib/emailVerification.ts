// ─── Email Verification — Real Email via Taskade Automation ───────────────────
// OTPs are generated here in the browser, stored in memory (5 min TTL),
// and delivered to the user's inbox by the Taskade webhook automation flow
// which calls Gmail's API under the hood.

const OTP_LENGTH  = 6;
const OTP_TTL_MS  = 5 * 60 * 1_000; // 5 minutes

// Webhook endpoints (Taskade automation flows)
const SEND_OTP_WEBHOOK   = '/api/taskade/webhooks/01KJE0M3TJC8FJSZM6DJ2JPFRY/run';
const RESET_CONF_WEBHOOK = '/api/taskade/webhooks/01KJE0M7X4SYEF7XYXB9DSEMK7/run';

export type OtpPurpose = 'verification' | 'reset';

interface OtpRecord {
  code:      string;
  email:     string;
  purpose:   OtpPurpose;
  expiresAt: number;
}

// Per-purpose in-memory stores (cleared on page reload — acceptable for SPA)
const otpStore: Partial<Record<OtpPurpose, OtpRecord>> = {};

/** Generate a random N-digit OTP string */
function generateCode(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

/**
 * Send a real OTP email via the Taskade automation webhook.
 * The webhook calls Gmail and delivers a branded HTML email to the user.
 */
export async function sendVerificationEmail(
  email: string,
  purpose: OtpPurpose = 'verification',
  displayName = '',
): Promise<{ ok: boolean; error?: string }> {
  const code = generateCode(OTP_LENGTH);

  // Store locally for later verification
  otpStore[purpose] = {
    code,
    email:     email.toLowerCase().trim(),
    purpose,
    expiresAt: Date.now() + OTP_TTL_MS,
  };

  try {
    const res = await fetch(SEND_OTP_WEBHOOK, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, purpose, displayName }),
    });

    if (!res.ok) {
      console.error('[OTP] Webhook returned', res.status);
      return { ok: false, error: 'Failed to send email. Please try again.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[OTP] Network error', err);
    return { ok: false, error: 'Network error. Please check your connection.' };
  }
}

/** Validate an OTP entered by the user. */
export function verifyOtp(
  email:       string,
  enteredCode: string,
  purpose:     OtpPurpose = 'verification',
): { valid: boolean; reason?: string } {
  const record = otpStore[purpose];

  if (!record) {
    return { valid: false, reason: 'No code was sent. Please request a new one.' };
  }
  if (record.email !== email.toLowerCase().trim()) {
    return { valid: false, reason: 'Code was sent to a different email address.' };
  }
  if (Date.now() > record.expiresAt) {
    delete otpStore[purpose];
    return { valid: false, reason: 'Code has expired. Please request a new one.' };
  }
  if (enteredCode.trim() !== record.code) {
    return { valid: false, reason: 'Incorrect code. Please try again.' };
  }

  delete otpStore[purpose]; // invalidate after use
  return { valid: true };
}

/**
 * Send a "password changed successfully" confirmation email.
 * Called after the password is updated in the store.
 */
export async function sendPasswordChangedEmail(
  email:       string,
  displayName = '',
): Promise<void> {
  try {
    await fetch(RESET_CONF_WEBHOOK, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName }),
    });
  } catch {
    // Fire-and-forget — non-critical
  }
}

/** @deprecated kept for backward-compatibility with any remaining callers */
export function getLastSentCode(): string | null {
  return null;
}

/** Validate email format: must contain @ and at least one dot after @ */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
