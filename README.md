<div align="center">
  <img src="https://raw.githubusercontent.com/ojasv/proof-of-backing/main/public/logo.jpg" alt="ZeroVault Logo" width="150" height="auto" />
  <h1>ZeroVault: Cryptographic Proof of Reserves</h1>
  <p><em>The Next-Generation, Real-Time Solvency Engine for Cryptocurrency Exchanges.</em></p>
</div>

---

## 🚨 The Problem: The "Static Audit" Illusion

The collapse of massive cryptocurrency exchanges like FTX revealed a fatal flaw in how the industry handles solvency and audits. 

Historically, "Proof of Reserves" has relied on two flawed methods:
1. **The "Proof of Fiat" (Accounting Firms):** A centralized accounting firm publishes a PDF claiming the exchange is solvent at a specific *snapshot in time*. (e.g., Tuesday at 5 PM). 
2. **The "Cold Wallet Dump":** Exchanges publish a list of their cold wallet addresses. While this proves they have *assets*, it completely hides their *liabilities* (what they actually owe users).

**The Fatal Flaw:** Audits are static. An exchange can be mathematically solvent on Tuesday, but if their collateral tokens crash on Wednesday, they are instantly bankrupt. *Snapshot audits cannot protect users from real-time market volatility.*

---

## 💡 The Solution: Real-Time ZK-PoR

**ZeroVault** is an enterprise-grade dashboard designed to continuously and cryptographically guarantee the solvency of exchanges.

By combining **Zero-Knowledge Cryptography (Noir)**, **Decentralized Storage (DataHaven)**, and **Live Oracles**, ZeroVault proves mathematically that `Assets >= Liabilities` in real-time without ever revealing sensitive proprietary data.

### 🌟 Key Features

#### 1. Real-Time Oracle & DEX Aggregation
ZeroVault doesn't wait for a monthly audit. We built a live **Oracle & DEX Price Feed aggregator** directly into the dashboard. As the price of collateral assets fluctuates (e.g., experiencing a real-time BTC price crash), the system dynamically recalculates the exchange's backing ratio. If the live reserves ever drop below the circulating supply, the system instantly triggers an insolvency alarm and halts new ZK proofs.

#### 2. The Zero-Knowledge Engine (Noir)
Our cryptographic engine is built using **Noir** (`circuit/src/main.nr`). 
The circuit takes the exchange's private `Reserve Arrays` and public `Liabilities` as inputs. It runs the mathematical constraints inside a locally-generated SNARK. If fully backed, it generates an unforgeable Proof Hash, keeping the exact asset numbers completely hidden from the public eye.

#### 3. Decentralized Storage (DataHaven StorageHub)
We eliminate the "AWS S3" centralization vector. During validation, the exact JSON snapshot of the reserves and liabilities is encrypted and pushed directly to the **DataHaven Decentralized Storage Network**. The resulting `CID` (Content Identifier) acts as an immutable receipt of the backend state.

#### 4. Immutable On-Chain Anchoring (Ethereum)
ZeroVault integrates directly with **viem** and **MetaMask**. Once the ZK Proof is generated and the DataHaven `CID` is secured, the dashboard transforms them into HEX calldata. The Exchange Administrator broadcasts this directly to the **Ethereum Network** (Sepolia Testnet), anchoring a private ZK audit onto a permanent, public blockchain ledger.

---

## 🛠️ The Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js (App Router)** | High-performance React framework for the dashboard |
| **Tailwind CSS v4** | Enterprise-grade B2B Slate styling and responsive grid |
| **Noir / Barretenberg** | The Zero-Knowledge Prover & Verifier circuits (`main.nr`) |
| **DataHaven SDK** | Encrypting and sealing snapshots to decentralized storage |
| **Viem & MetaMask** | Ethereum JSON-RPC connections for on-chain anchoring |
| **React Hooks** | Real-time global state syncing across the Oracle and UI |

---

## 💻 Running the Application

### 1. Spin Up DataHaven Local Devnet
ZeroVault relies on a local DataHaven StorageHub node. To spin it up, clone the official repository and start the devnet using Docker:

\`\`\`bash
# Clone the StorageHub repository
git clone https://github.com/Moonsong-Labs/storage-hub.git
cd storage-hub/test

# Install dependencies and pull Docker images
pnpm i
docker pull --platform linux/amd64 moonsonglabs/storage-hub:latest
docker tag moonsonglabs/storage-hub:latest storage-hub:local
docker pull --platform linux/amd64 moonsonglabs/storage-hub-msp-backend:latest
docker tag moonsonglabs/storage-hub-msp-backend:latest sh-msp-backend:local

# Start the local solochain-evm devnet
pnpm docker:start:solochain-evm:initialised
\`\`\`
*(Wait for the "✅ Solochain EVM Bootstrap success" message before proceeding).*

### 2. Start the ZeroVault Dashboard
Once the DataHaven devnet is running on port 8080/9666, open a new terminal window to run the ZeroVault dashboard:

\`\`\`bash
# Clone the ZeroVault repository
git clone https://github.com/yourusername/proof-of-backing.git
cd proof-of-backing

# Install dependencies and start the local development server
npm install
npm run dev
# The application will be live at http://localhost:3000
\`\`\`

### 3. The End-to-End Flow
1. Navigate to `http://localhost:3000/issuer`.
2. Play with the **Live Oracle Sidebar** to aggregate real-time market volatility and watch the Reserve Assets dynamically update.
3. Click **Encrypt, Seal to DataHaven & Generate Proof**.
4. Once the Noir proof logic succeeds, click **Confirm On-Chain Anchor**.
5. Sign the MetaMask popup bridging the Proof and CID onto the Ethereum ledger.
6. Navigate to the `/history` tab to view the public Etherscan blockchain receipt!


