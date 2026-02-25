// Noir ZK Verifier Logic (Mock / Abstraction)

export interface ProofVerificationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Verifies a Noir proof for the Proof of Backing circuit.
 * @param proof The generated ZK proof.
 * @param circulatingSupply The public input (liabilities).
 * @returns true if the proof correctly asserts sum(reserves) >= circulatingSupply.
 */
export async function verifyNoirProof(proof: string, circulatingSupply: number): Promise<ProofVerificationResult> {
    console.log(`Verifying proof...`);
    console.log(`Public Input (Circulating Supply): ${circulatingSupply}`);

    // Simulate compilation/verification time
    await new Promise(resolve => setTimeout(resolve, 1800));

    // For the demo, we embed verification logic here instead of executing the heavy WASM barretenberg backend.
    // If the proof string indicates a failure test case, we return false.
    if (proof === "INVALID_PROOF_PAYLOAD") {
        return { isValid: false, error: "Under-collateralized: sum(reserves) < circulating_supply" };
    }

    if (!proof.startsWith("NOIR_ZK_PROOF")) {
        return { isValid: false, error: "Invalid Proof Format" };
    }

    return { isValid: true };
}

/**
 * Generates a mock Noir proof for testing purposes.
 * @param reserves Private input array of reserves.
 * @param circulatingSupply Public input.
 */
export async function generateNoirProof(reserves: number[], circulatingSupply: number): Promise<string> {
    console.log(`Generating proof for reserves ${JSON.stringify(reserves)} and supply ${circulatingSupply}`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const totalReserves = reserves.reduce((a, b) => a + b, 0);

    // Mimics the circuit logic `assert(total_reserves >= circulating_supply);`
    if (totalReserves >= circulatingSupply) {
        return `NOIR_ZK_PROOF_${Buffer.from(totalReserves.toString()).toString('base64')}`;
    } else {
        return "INVALID_PROOF_PAYLOAD";
    }
}
