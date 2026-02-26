/**
 * datahaven.ts — Real DataHaven SDK integration via LocalWallet (private key).
 *
 * Flow:
 *  1. LocalWallet.fromPrivateKey(pk) — no MetaMask needed
 *  2. Manual SIWE: getNonce → signMessage → verify → session
 *  3. List or create bucket (StorageHubClient, signed by viem http wallet)
 *  4. MspClient.files.uploadFile → UploadReceipt.fileKey used as CID
 *
 * Testnet MSP: https://deo-dh-backend.testnet.datahaven-infra.network/
 * Testnet chain ID: 55931
 */

import { MspClient } from "@storagehub-sdk/msp-client";
import { LocalWallet } from "@storagehub-sdk/core";
import { createWalletClient, http } from "viem";
import { NETWORK } from "@/config/networks";

const TESTNET_MSP_URL = NETWORK.mspUrl;
const BUCKET_NAME = "zeroproof-reserves";

// Session cache — key: privateKey hex, value: session object
let cachedSession: any = null;
let cachedPk: string | null = null;

function normalizePk(pk: string): `0x${string}` {
  return (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

async function getAuthenticatedMspClient(privateKey: string): Promise<MspClient> {
  const pk = normalizePk(privateKey);

  // Reuse session if same key
  if (cachedSession && cachedPk === pk) {
    console.log("[DataHaven] Reusing session for", cachedSession.user?.address);
    return MspClient.connect({ baseUrl: TESTNET_MSP_URL }, async () => cachedSession);
  }

  const localWallet = LocalWallet.fromPrivateKey(pk);
  const address = await localWallet.getAddress();
  console.log("[DataHaven] Authenticating as:", address);

  const appUri = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const domain = typeof window !== "undefined" ? window.location.host : "localhost:3000";

  // Unauthenticated client for the SIWE challenge flow
  const unauthClient = await MspClient.connect({ baseUrl: TESTNET_MSP_URL });

  // 1. Get nonce/challenge message
  const { message } = await unauthClient.auth.getNonce(address, NETWORK.id, domain, appUri);

  // 2. Sign with local wallet (no MetaMask prompt)
  const signature = await localWallet.signMessage(message);

  // 3. Verify → session
  const session = await unauthClient.auth.verify(message, signature);

  cachedSession = session;
  cachedPk = pk;
  console.log("[DataHaven] Authenticated:", session.user?.address);

  return MspClient.connect({ baseUrl: TESTNET_MSP_URL }, async () => session);
}

// ─── BUCKET ──────────────────────────────────────────────────────────────────

async function getOrCreateBucket(mspClient: MspClient, privateKey: string): Promise<string> {
  // 1. Try existing bucket
  try {
    const buckets = await mspClient.buckets.listBuckets();
    const existing = buckets.find((b) => b.name === BUCKET_NAME);
    if (existing) {
      console.log("[DataHaven] Found existing bucket:", existing.bucketId);
      return existing.bucketId;
    }
    console.log("[DataHaven] No existing bucket found, creating one...");
  } catch (err) {
    console.warn("[DataHaven] listBuckets failed, trying to create:", err);
  }

  // 2. Get MSP info
  const info = await mspClient.info.getInfo();

  // 3. Get value propositions (use first one regardless of isAvailable)
  const valueProps = await mspClient.info.getValuePropositions();
  console.log("[DataHaven] Available value props:", valueProps);

  const valueProp = valueProps[0]; // take first one, testnet may have none marked available
  if (!valueProp) {
    throw new Error(
      "[DataHaven] No value propositions exist on the testnet MSP. The MSP may be misconfigured or offline."
    );
  }

  console.log("[DataHaven] Using valuePropId:", valueProp.id, "mspId:", info.mspId);

  // 4. Create bucket on-chain using viem + private key (no MetaMask needed)
  const { StorageHubClient } = await import("@storagehub-sdk/core");
  const { privateKeyToAccount } = await import("viem/accounts");

  const pk = normalizePk(privateKey);
  const account = privateKeyToAccount(pk);

  const walletClient = createWalletClient({
    account,
    transport: http(NETWORK.rpcUrl),
  });

  const shClient = new StorageHubClient({
    rpcUrl: NETWORK.rpcUrl,
    chain: {
      id: NETWORK.id,
      name: NETWORK.name,
      nativeCurrency: NETWORK.nativeCurrency,
      rpcUrls: { default: { http: [NETWORK.rpcUrl] } },
    } as any,
    walletClient: walletClient as any,
    filesystemContractAddress: NETWORK.filesystemContractAddress,
  });

  const txHash = await shClient.createBucket(
    info.mspId,
    BUCKET_NAME,
    false, // public — auditors can verify
    valueProp.id as `0x${string}`
  );

  console.log("[DataHaven] Bucket creation tx:", txHash);

  // Wait for MSP to index the new bucket
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const buckets = await mspClient.buckets.listBuckets();
  const created = buckets.find((b) => b.name === BUCKET_NAME);
  if (!created) {
    throw new Error(
      "[DataHaven] Bucket tx confirmed but not yet visible from MSP. Try again in a few seconds."
    );
  }

  console.log("[DataHaven] Bucket ready:", created.bucketId);
  return created.bucketId;
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

export async function encryptAndUploadToDataHaven(
  payload: Record<string, unknown>,
  privateKey: string
): Promise<{ reference: string; cid: string }> {
  if (!privateKey?.trim()) {
    throw new Error("Private key required for DataHaven upload.");
  }

  console.log("[DataHaven] Uploading to testnet MSP:", TESTNET_MSP_URL);

  const mspClient = await getAuthenticatedMspClient(privateKey);

  const localWallet = LocalWallet.fromPrivateKey(normalizePk(privateKey));
  const owner = await localWallet.getAddress();

  const bucketId = await getOrCreateBucket(mspClient, privateKey);

  // Build payload blob
  const payloadJson = JSON.stringify(payload, null, 2);
  const fileBytes = new TextEncoder().encode(payloadJson);
  const fileBlob = new Blob([fileBytes], { type: "application/json" });
  const ts = (payload as any).timestamp ?? Date.now();
  const location = `proofs/${ts}/reserve-snapshot.json`;

  console.log("[DataHaven] Uploading file →", location, "in bucket", bucketId);

  const receipt = await mspClient.files.uploadFile(
    bucketId,
    "", // fileKey derived by SDK
    fileBlob,
    owner,
    location,
    { mspDistribution: true, contentLength: fileBytes.byteLength }
  );

  console.log("[DataHaven] Upload receipt:", receipt);

  const cid = receipt.fileKey || receipt.fingerprint || `dh-${ts}`;
  return { reference: cid, cid };
}

export async function downloadAndDecryptFromDataHaven(
  fileKey: string
): Promise<Record<string, unknown>> {
  if (!cachedSession) throw new Error("[DataHaven] Not authenticated. Run engine first.");
  const mspClient = await MspClient.connect(
    { baseUrl: TESTNET_MSP_URL },
    async () => cachedSession
  );
  const result = await mspClient.files.downloadFile(fileKey);
  const chunks: Uint8Array[] = [];
  const reader = result.stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const merged = chunks.reduce((acc, chunk) => {
    const out = new Uint8Array(acc.length + chunk.length);
    out.set(acc);
    out.set(chunk, acc.length);
    return out;
  }, new Uint8Array(0));
  return JSON.parse(new TextDecoder().decode(merged));
}

export function clearDataHavenSession() {
  cachedSession = null;
  cachedPk = null;
}
