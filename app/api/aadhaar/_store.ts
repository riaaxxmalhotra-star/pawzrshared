import { createHash } from 'crypto';

// Shared Aadhaar OTP state for the sidecar routes.
//
// Security properties (Wave 2 audit remediation):
// - Full Aadhaar numbers are NEVER stored — only a SHA-256 hash for binding
//   the transaction to the number that requested it.
// - Every record is bound to the caller's session identity (hash of the
//   Bearer token). A transaction ID alone is useless across accounts.
// - Transactions expire after 10 minutes and are capped at 5 OTP attempts.
// - OTP issuance is rate-limited per identity (5 per 10 minutes) so leaked
//   access cannot burn the Digio quota at scale.
// - Verification results are keyed by identity (not by Aadhaar last-4, which
//   collides), so /status can answer truthfully per caller.
//
// Production note: this module is in-memory per serverless instance. It is
// safe for single-instance/dev and for correctness of the protocol, but a
// multi-instance deployment must swap the Map backend for Redis/DB with TTL.
// The function boundaries below are deliberately storage-shaped for that swap.

const TRANSACTION_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_OTP_REQUESTS_PER_WINDOW = 5;
const MAX_ENTRIES = 5000;

export interface OtpTransaction {
  hashedAadhaar: string;
  transactionId: string;
  identity: string;
  createdAt: number;
  attempts: number;
}

export interface VerificationRecord {
  identity: string;
  maskedLast4: string;
  name: string;
  verifiedAt: number;
}

const transactions = new Map<string, OtpTransaction>();
const verifications = new Map<string, VerificationRecord>();
const rateLimits = new Map<string, { count: number; windowStart: number }>();

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function hashAadhaar(aadhaarNumber: string): string {
  return sha256(`aadhaar:${aadhaarNumber}`);
}

/**
 * Derive the caller's identity from the Authorization header. The token is
 * hashed immediately and never retained. Full JWT signature verification
 * belongs to the main backend — when this sidecar runs behind it, replace
 * this with the verified `sub` claim.
 */
export function getIdentityFromRequest(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  return sha256(`session:${token}`);
}

function sweepExpired(now: number): void {
  for (const [key, txn] of transactions) {
    if (now - txn.createdAt > TRANSACTION_TTL_MS) transactions.delete(key);
  }
  for (const [key, rl] of rateLimits) {
    if (now - rl.windowStart > RATE_LIMIT_WINDOW_MS) rateLimits.delete(key);
  }
  // Hard cap so a hot loop can never grow memory unbounded.
  if (transactions.size > MAX_ENTRIES) {
    const oldest = [...transactions.entries()]
      .sort((a, b) => a[1].createdAt - b[1].createdAt)
      .slice(0, transactions.size - MAX_ENTRIES);
    for (const [key] of oldest) transactions.delete(key);
  }
}

export function checkRateLimit(identity: string): boolean {
  const now = Date.now();
  sweepExpired(now);
  const entry = rateLimits.get(identity);
  if (!entry) {
    rateLimits.set(identity, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= MAX_OTP_REQUESTS_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

export function saveTransaction(record: Omit<OtpTransaction, 'createdAt' | 'attempts'>): void {
  sweepExpired(Date.now());
  transactions.set(record.transactionId, { ...record, createdAt: Date.now(), attempts: 0 });
}

export function getTransaction(
  transactionId: string,
  identity: string
): { status: 'ok'; transaction: OtpTransaction } | { status: 'missing' } | { status: 'expired' } {
  const txn = transactions.get(transactionId);
  if (!txn || txn.identity !== identity) return { status: 'missing' };
  if (Date.now() - txn.createdAt > TRANSACTION_TTL_MS) {
    transactions.delete(transactionId);
    return { status: 'expired' };
  }
  return { status: 'ok', transaction: txn };
}

/** Returns false when the attempt budget is exhausted (transaction consumed). */
export function recordOtpAttempt(transactionId: string): boolean {
  const txn = transactions.get(transactionId);
  if (!txn) return false;
  txn.attempts += 1;
  if (txn.attempts >= MAX_OTP_ATTEMPTS) {
    transactions.delete(transactionId);
    return false;
  }
  return true;
}

export function consumeTransaction(transactionId: string): void {
  transactions.delete(transactionId);
}

export function saveVerification(record: Omit<VerificationRecord, 'verifiedAt'>): void {
  verifications.set(record.identity, { ...record, verifiedAt: Date.now() });
}

export function getVerification(identity: string): VerificationRecord | null {
  return verifications.get(identity) ?? null;
}
