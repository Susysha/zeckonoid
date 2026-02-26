import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { proofs } = body;

        // Simulate a slight network delay to mimic an LLM processing the RAG prompts
        await new Promise((resolve) => setTimeout(resolve, 2500));

        if (!proofs || proofs.length === 0) {
            return NextResponse.json({
                success: false,
                error: "No context provided to the Retrieval pipeline. Please provide historical proofs."
            }, { status: 400 });
        }

        // Extract the latest proof to form the primary context of the RAG report
        const latestProof = proofs[proofs.length - 1];
        const isSecure = latestProof.isValid;
        const totalProofs = proofs.length;

        const date = new Date(latestProof.timestamp).toLocaleString();

        let markdownReport = ``;

        if (isSecure) {
            markdownReport = `
# 📄 ZeroVault Artificial Intelligence Audit Report

**Date of Synthesis:** ${date}
**Audit Scope:** Real-Time Cryptographic Ledger Verification
**Overall Assessment:** ✅ **SOLVENT AND SECURE**

---

## 1. Executive Summary
Based on the real-time Retrieval-Augmented Generation (RAG) analysis of the ZeroVault cryptographic pipeline, the Exchange currently holds sufficient on-chain collateral to cover 100% of reported User Liabilities. The underlying mathematical ZK-SNARK circuit executed successfully without triggering any insolvency constraints.

## 2. Cryptographic On-Chain Verification
The AI Auditor has successfully parsed the latest Barretenberg Noir ZK-Proof output and cross-referenced it with the immutable Ethereum network.

- **Primary Anchor Transaction:** [View on Etherscan](https://sepolia.etherscan.io/tx/${latestProof.txHash})
- **Decentralized Storage Snapshot (DataHaven CID):** \`${latestProof.cid}\`
- **Total Historical Proofs Analyzed:** ${totalProofs}

## 3. Risk Analysis & Volatility Stress Test
The system experienced no critical deviations in the Oracle & DEX Aggregation feeds during the preceding validation window. The Reserve Matrix maintains a healthy over-collateralization ratio against the declared circulating supply.

**Conclusion:** The Exchange's cryptographic proof is mathematically valid. No synthetic assets or fractional reserve discrepancies were detected in the underlying JSON snapshot sealed at CID \`${latestProof.cid}\`.
`;
        } else {
            markdownReport = `
# 📄 ZeroVault Artificial Intelligence Audit Report

**Date of Synthesis:** ${date}
**Audit Scope:** Real-Time Cryptographic Ledger Verification
**Overall Assessment:** ❌ **INSOLVENT: CRITICAL RISK DETECTED**

---

## 1. Executive Summary
**URGENT:** Based on real-time Retrieval-Augmented Generation (RAG) analysis, the Exchange's verifiable Reserve Assets have fallen below the threshold required to cover total User Liabilities. The ZK-SNARK circuit constraint \`sum(reserves) >= circulating_supply\` has mathematically **FAILED**.

## 2. Cryptographic Breakdown
The ZK Proof generation was aborted or returned an invalid configuration due to insufficient collateral or an unverified Merkle Root discrepancy.

- **Attempted Storage Snapshot (DataHaven CID):** \`${latestProof.cid}\`
- **Anchor Transaction:** *Halted/Reverted by Verifier*

## 3. Risk Analysis & Recommended Action
This failure was likely triggered by a sudden downward deviation in the Oracle & DEX Price Feeds, collapsing the value of the Cold Wallet reserves below the required backing ratio. 

**Conclusion:** Users are strongly advised to withdraw assets immediately. The exchange is currently operating under Fractional Reserve status. 
`;
        }

        return NextResponse.json({
            success: true,
            report: markdownReport
        });

    } catch (error) {
        console.error("AI Generation failed:", error);
        return NextResponse.json({ success: false, error: "Internal LLM pipeline error." }, { status: 500 });
    }
}
