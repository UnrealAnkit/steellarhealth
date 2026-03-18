// src/lib/stellar.js
import * as StellarSdk from "stellar-sdk";

const NETWORK   = process.env.STELLAR_NETWORK || "TESTNET";
const HORIZON   = process.env.HORIZON_URL || "https://horizon-testnet.stellar.org";
const PASSPHRASE = NETWORK === "TESTNET"
  ? StellarSdk.Networks.TESTNET
  : StellarSdk.Networks.PUBLIC;

export const server = new StellarSdk.Horizon.Server(HORIZON);

// ── The ACCESS TOKEN asset ────────────────────────────────────────────────────
// In production: issue a custom Stellar asset called "HRTOKEN"
// For testnet demo: we check XLM balance >= threshold as proxy
export const ACCESS_THRESHOLD_XLM = 10; // must hold >= 10 XLM to access records

// ── Get account balances ──────────────────────────────────────────────────────
export async function getAccountBalances(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances.map(b => ({
      asset:   b.asset_type === "native" ? "XLM" : `${b.asset_code}:${b.asset_issuer?.slice(0,8)}`,
      balance: parseFloat(b.balance),
      type:    b.asset_type,
    }));
  } catch {
    return [];
  }
}

// ── Token-gate check ─────────────────────────────────────────────────────────
// Returns { allowed: bool, balance: number, reason: string }
export async function checkTokenAccess(publicKey) {
  try {
    const balances = await getAccountBalances(publicKey);
    const xlm      = balances.find(b => b.asset === "XLM");
    const bal      = xlm?.balance || 0;

    if (bal >= ACCESS_THRESHOLD_XLM) {
      return { allowed: true, balance: bal, reason: `Holds ${bal.toFixed(2)} XLM ≥ threshold of ${ACCESS_THRESHOLD_XLM} XLM` };
    }
    return { allowed: false, balance: bal, reason: `Insufficient balance: ${bal.toFixed(2)} XLM < ${ACCESS_THRESHOLD_XLM} XLM required` };
  } catch (e) {
    return { allowed: false, balance: 0, reason: `Account not found: ${e.message}` };
  }
}

// ── SEP-10 style challenge (simplified) ──────────────────────────────────────
// Real SEP-10: server issues a transaction, client signs it with their key
// Simplified: we issue a nonce, user signs it, we verify signature
export function generateChallenge(publicKey) {
  const nonce     = StellarSdk.Keypair.random().publicKey(); // random string
  const timestamp = Date.now();
  const message   = `stellar-health:${publicKey}:${nonce}:${timestamp}`;
  return { message, nonce, timestamp };
}

export function verifySignature(publicKey, message, signature) {
  try {
    const kp        = StellarSdk.Keypair.fromPublicKey(publicKey);
    const msgBuffer = Buffer.from(message, "utf-8");
    const sigBuffer = Buffer.from(signature, "base64");
    return kp.verify(msgBuffer, sigBuffer);
  } catch {
    return false;
  }
}

// ── Issue access token on-chain ───────────────────────────────────────────────
// Sends a dust payment with memo "HEALTH_ACCESS|{patientId}" as on-chain proof
export async function issueAccessTokenOnChain({ issuerSecretKey, recipientPublicKey, patientId }) {
  const issuerKP  = StellarSdk.Keypair.fromSecret(issuerSecretKey);
  const account   = await server.loadAccount(issuerKP.publicKey());
  const memoText  = `HEALTH|${patientId}`.slice(0, 28);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.payment({
      destination: recipientPublicKey,
      asset:       StellarSdk.Asset.native(),
      amount:      "0.0000001",
    }))
    .addMemo(StellarSdk.Memo.text(memoText))
    .setTimeout(180)
    .build();

  tx.sign(issuerKP);
  const result = await server.submitTransaction(tx);
  return { txHash: result.hash, ledger: result.ledger, memo: memoText };
}

// ── Verify a publicKey is valid Stellar address ───────────────────────────────
export function isValidStellarKey(key) {
  try {
    StellarSdk.Keypair.fromPublicKey(key);
    return true;
  } catch { return false; }
}

// ── Fund testnet account via Friendbot ───────────────────────────────────────
export async function fundTestnet(publicKey) {
  const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (JSON.stringify(body).includes("already")) return { funded: true, note: "Already funded" };
    throw new Error("Friendbot failed");
  }
  return { funded: true };
}
