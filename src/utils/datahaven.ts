/**
 * datahaven.ts — Mock DataHaven StorageHub integration.
 *
 * NOTE: The real @storagehub-sdk/core (and its @polkadot transitive deps) contain
 * octal escape sequences inside asm.js fallback template strings, which cause a
 * SyntaxError during SSR/prerender compilation on Vercel and Render.
 * The SDK is intentionally stubbed here for the demo build.
 */

export async function encryptAndUploadToDataHaven(
  payload: Record<string, unknown>,
  signerAddress: string
): Promise<{ reference: string; cid: string }> {
  console.log("[DataHaven] Connecting — signer:", signerAddress);

  const payloadString = JSON.stringify(payload);
  await new Promise((resolve) => setTimeout(resolve, 1800));

  // Deterministic-looking CID from payload content
  const hash = Array.from(payloadString)
    .reduce((acc, c) => acc + c.charCodeAt(0), 0)
    .toString(36);
  const mockCID = `bafybei${hash}${Math.random().toString(36).substring(2, 10)}`;

  console.log("[DataHaven] Uploaded. CID:", mockCID);
  return { reference: mockCID, cid: mockCID };
}

export async function downloadAndDecryptFromDataHaven(
  cid: string
): Promise<Record<string, unknown>> {
  console.log("[DataHaven] Fetching CID:", cid);
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return { status: "Downloaded", cid };
}
