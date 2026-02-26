import { createWalletClient, createPublicClient, custom, toHex } from 'viem';
import { sepolia } from 'viem/chains';

// A standard standard burn address to deposit the immutable proof payload
const REGISTRY_ADDRESS = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;

/**
 * Anchors a generated Zero-Knowledge proof and its corresponding DataHaven CID
 * to an EVM-compatible blockchain. Requires a browser extension wallet (e.g. MetaMask).
 * 
 * @param cid The DataHaven Content ID where the exact encrypted snapshot is stored.
 * @param zkProof The mathematical string output by the Barretenberg Noir prover.
 * @returns The blockchain transaction hash if successful.
 */
export async function anchorProofOnChain(cid: string, zkProof: string): Promise<string> {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("No Web3 wallet injected. Please install MetaMask or a similar extension.");
    }

    // @ts-ignore - bypassing rigorous viem provider typing for quick injection
    const provider = window.ethereum;

    // 1. Initialize Viem clients using the injected window.ethereum provider
    const publicClient = createPublicClient({
        chain: sepolia,
        transport: custom(provider as any)
    });

    const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(provider as any)
    });

    // 2. Request user accounts
    const [account] = await walletClient.requestAddresses();
    if (!account) {
        throw new Error("User denied account access or no accounts found.");
    }

    // 3. Force switch to Sepolia (Chain ID: 11155111)
    try {
        await walletClient.switchChain({ id: sepolia.id });
    } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902 || switchError?.message?.includes('Unrecognized chain ID')) {
            try {
                await walletClient.addChain({ chain: sepolia });
            } catch (addError) {
                throw new Error("Failed to add Sepolia network to your MetaMask.");
            }
        } else {
            console.warn("Could not switch chains automatically:", switchError);
        }
    }

    // 4. Prepare the "calldata" payload.
    // We encode the DataHaven CID and the ZK Proof into a single hex string.
    const payloadString = `ZEROVAULT_ANCHOR||${cid}||${zkProof}`;
    const hexData = toHex(payloadString);

    console.log(`Sending Anchor Tx from ${account}...`);

    // 4. Send the transaction
    const txHash = await walletClient.sendTransaction({
        account,
        to: REGISTRY_ADDRESS,
        data: hexData,
        value: BigInt(0), // 0 ETH transaction, just paying gas
    });

    console.log(`Tx broadcasted! Hash: ${txHash}`);

    // 5. Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status !== 'success') {
        throw new Error("On-chain transaction reverted.");
    }

    return receipt.transactionHash;
}
