# Zero-Knowledge Proof of Backing DApp

This project demonstrates a decentralized proof-of-reserves protocol using **Next.js**, **TailwindCSS**, **Noir ZK circuits**, and **DataHaven StorageHub SDK**.

## System Architecture Flow
1. **Issuer Dashboard**: The protocol inputs reserve snapshot and liabilities.
2. **DataHaven Upload**: The breakdown is AES encrypted and pushed to DataHaven's StorageHub SDK.
3. **ZK Proof Generation**: A Noir circuit verifies `Sum(Reserves) >= Circulating Supply`.
4. **Auditor / Watchdog**: Verifies the CID payload and mathematically proves protocol backing.

## How to Run It Local (Next.js)

1. Navigate to the `proof-of-backing` folder.
2. Ensure you have Node installed.
3. Install dependencies (if you haven't):
```bash
npm install
```
4. Run the development server:
```bash
npm run dev
```
5. Open `http://localhost:3000` in your browser.

## Noir ZK Circuit Setup & Compilation

The core mathematical verification resides in `circuit/src/main.nr`.

### Prerequisites
You need the Noir compilation toolchain (`nargo`) installed. 
Visit [Noir Setup documentation](https://noir-lang.org/docs/getting_started/installation/).

```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup
```

### Compiling the Circuit
Navigate into the `circuit` directory and utilize the `nargo` tool to compile the binary circuit and test it:

```bash
cd circuit

# 1. Compile the circuit and generate Prover.toml / Verifier.toml
nargo check

# 2. Run internal circuit tests (Validates the "Fully Backed" and "Under-collateralized" models)
nargo test

# 3. Generate a proof (will look for values in Prover.toml)
nargo execute witness_name
nargo prove proof_name

# 4. Verify a proof
nargo verify proof_name
```

## StorageHub Integration 

The `src/utils/datahaven.ts` securely acts as the gateway via `@datahaven/storagehub` bridging encrypted on-chain footprints with massive off-chain datasets required for verifications.
