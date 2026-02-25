import { MspClient } from '@storagehub-sdk/msp-client';
import {
    getStorageHubClient,
    getWalletAddress,
    publicClient,
    getClientServices
} from '../services/clientService';
import {
    getMspInfo,
    getValueProps,
} from '../services/mspService';

export async function createBucket(bucketName: string, mspClient: MspClient, privateKey: string) {
    const { mspId } = await getMspInfo(mspClient);

    const valuePropId = await getValueProps(mspClient);
    console.log(`Value Prop ID: ${valuePropId}`);

    const address = getWalletAddress(privateKey);
    const { storageHubClient } = getStorageHubClient(privateKey);

    const bucketId = (await storageHubClient.deriveBucketId(
        address,
        bucketName,
    )) as string;
    console.log(`Derived bucket ID: ${bucketId}`);

    const { polkadotApi } = await getClientServices(privateKey);

    const bucketBeforeCreation =
        await polkadotApi.query.providers.buckets(bucketId);
    console.log('Bucket before creation is empty:', bucketBeforeCreation.isEmpty);
    if (!bucketBeforeCreation.isEmpty) {
        return { bucketId, txReceipt: "Already Exists" };
    }

    const isPrivate = false;

    const txHash: `0x${string}` | undefined = await storageHubClient.createBucket(
        mspId as `0x${string}`,
        bucketName,
        isPrivate,
        valuePropId,
    );

    console.log('createBucket() txHash:', txHash);
    if (!txHash) {
        throw new Error('createBucket() did not return a transaction hash');
    }

    const txReceipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
    });
    if (txReceipt.status !== 'success') {
        throw new Error(`Bucket creation failed: ${txHash}`);
    }

    return { bucketId, txReceipt };
}

export async function verifyBucketCreation(bucketId: string, mspClient: MspClient, privateKey: string) {
    const { polkadotApi } = await getClientServices(privateKey);

    const bucket = await polkadotApi.query.providers.buckets(bucketId);
    if (bucket.isEmpty) {
        throw new Error('Bucket not found on chain after creation');
    }

    const bucketData = (bucket as any).unwrap().toHuman();
    return bucketData;
}

export async function waitForBackendBucketReady(bucketId: string, mspClient: MspClient) {
    const maxAttempts = 10;
    const delayMs = 2000;

    for (let i = 0; i < maxAttempts; i++) {
        console.log(`Checking for bucket in MSP backend, attempt ${i + 1} of ${maxAttempts}...`);
        try {
            const bucket = await mspClient.buckets.getBucket(bucketId);
            if (bucket) {
                console.log('Bucket found in MSP backend:', bucket);
                return;
            }
        } catch (error: any) {
            if (error?.status === 404 || error?.body?.error === 'Not found: Record') {
                console.log(`Bucket not found in MSP backend yet (404).`);
            } else {
                console.log('Unexpected error while fetching bucket from MSP:', error);
                throw error;
            }
        }
        await new Promise((r) => setTimeout(r, delayMs));
    }
    throw new Error(`Bucket ${bucketId} not found in MSP backend after waiting`);
}
