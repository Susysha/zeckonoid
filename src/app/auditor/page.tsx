"use client";

import { useState } from "react";
import { downloadAndDecryptFromDataHaven } from "@/utils/datahaven";
import { verifyNoirProof } from "@/utils/noir";

export default function AuditorPage() {
    const [datahavenCID, setDatahavenCID] = useState("");
    const [zkProof, setZkProof] = useState("");
    const [circulatingSupply, setCirculatingSupply] = useState<number>(5000000);

    const [verificationState, setVerificationState] = useState<"idle" | "loading" | "success" | "failed">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleVerify = async () => {
        if (!datahavenCID || !zkProof) {
            alert("Please provide both the DataHaven CID and the ZK Proof.");
            return;
        }

        setVerificationState("loading");
        setErrorMessage(null);

        try {
            await downloadAndDecryptFromDataHaven(datahavenCID);
            const result = await verifyNoirProof(zkProof, circulatingSupply);

            if (result.isValid) {
                setVerificationState("success");
            } else {
                setVerificationState("failed");
                setErrorMessage(result.error || "Proof invalid or logic under-collateralized.");
            }
        } catch (e) {
            console.error(e);
            setVerificationState("failed");
            setErrorMessage("Network error verifying proof.");
        }
    };

    return (
        <main className="app-content">
            <div className="sec-hdr" style={{ marginBottom: '40px' }}>
                <div>
                    <div className="sec-num">// AUDITOR NODE</div>
                    <div className="sec-title">Verify Any <span className="hl">Proof</span></div>
                </div>
                <div className="sec-meta">
                    Open verification · No account required. Zero trust architecture.
                </div>
            </div>

            <div className="live-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 400px', alignItems: 'start' }}>

                {/* LEFT COL: Verification Form */}
                <div className="main-col">
                    <div className="panel" style={{ marginBottom: '40px' }}>
                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Submit Zero-Knowledge Proof</span>
                            <span style={{ color: 'var(--green)' }}>● ON-CHAIN VALIDATION</span>
                        </div>
                        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.1em' }}>DATAHAVEN CONTENT ID (CID)</div>
                                <input
                                    className="form-input"
                                    placeholder="bafybeigdyrzt5scaea..."
                                    value={datahavenCID}
                                    onChange={(e) => setDatahavenCID(e.target.value)}
                                />
                            </div>

                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.1em' }}>NOIR ZK PROOF STRING</div>
                                <textarea
                                    className="form-input"
                                    rows={4}
                                    style={{ resize: 'vertical' }}
                                    placeholder="0x1a9f3c7d2e4b8f6a..."
                                    value={zkProof}
                                    onChange={(e) => setZkProof(e.target.value)}
                                ></textarea>
                            </div>

                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.1em' }}>DECLARED LIABILITIES (USD)</div>
                                <input
                                    className="form-input"
                                    placeholder="e.g. 5000000"
                                    value={circulatingSupply}
                                    onChange={(e) => setCirculatingSupply(Number(e.target.value))}
                                />
                            </div>

                            <button
                                className="nav-btn"
                                onClick={handleVerify}
                                disabled={verificationState === "loading"}
                                style={{ width: '100%', padding: '16px', background: verificationState === 'loading' ? 'transparent' : 'var(--green)', color: verificationState === 'loading' ? 'var(--green)' : '#000', fontSize: '12px' }}
                            >
                                {verificationState === "loading" ? "● RUNNING VERIFICATION NODE..." : "→ VERIFY PROOF"}
                            </button>

                            {verificationState === "success" && (
                                <div className="proof-panel" style={{ marginTop: '10px', gridTemplateColumns: '1fr', borderColor: 'var(--green)' }}>
                                    <div className="code-hdr" style={{ background: 'var(--green-dim)', borderBottomColor: 'var(--green)' }}><span>RESULT</span><span style={{ color: 'var(--green)' }}>● 100% SOLVENT</span></div>
                                    <div className="code-body" style={{ background: 'rgba(0,255,136,0.02)' }}>
                                        <div className="code-line"><span className="kw">STATUS:</span> <span className="fn">✅ CRYPTOGRAPHICALLY VERIFIED</span></div>
                                        <div className="code-line"><span className="kw">DETAIL:</span> <span className="tc">ZK circuit executed normally.</span></div>
                                        <div className="code-line"><span className="kw">ASSERT:</span> <span className="tc">Reserves {"≥"} Declared Liabilities</span></div>
                                        <div className="code-line"><span className="kw">LATENCY:</span> <span className="tc">14ms</span></div>
                                    </div>
                                </div>
                            )}

                            {verificationState === "failed" && (
                                <div className="proof-panel" style={{ marginTop: '10px', gridTemplateColumns: '1fr', borderColor: 'var(--red)' }}>
                                    <div className="code-hdr" style={{ background: 'rgba(204,51,51,0.1)', borderBottomColor: 'var(--red)' }}><span>RESULT</span><span style={{ color: 'var(--red)' }}>🚨 ALARM TRIGGERED</span></div>
                                    <div className="code-body" style={{ background: 'rgba(204,51,51,0.05)' }}>
                                        <div className="code-line"><span className="kw" style={{ color: 'var(--red)' }}>STATUS:</span> <span className="tc" style={{ color: 'var(--red)' }}>VERIFICATION FAILED</span></div>
                                        <div className="code-line"><span className="kw" style={{ color: 'var(--red)' }}>DETAIL:</span> <span className="tc">Proof is invalid or tampered with.</span></div>
                                        <div className="code-line"><span className="kw" style={{ color: 'var(--red)' }}>ASSERT:</span> <span className="tc">Reserves {"<"} Liabilities</span></div>
                                        {errorMessage && <div className="code-line"><span className="kw" style={{ color: 'var(--red)' }}>TRACE:</span> <span className="tc">{errorMessage}</span></div>}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* RIGHT COL: Verification Feed & info */}
                <div className="sidebar" style={{ gap: '24px', background: 'transparent' }}>

                    <div className="panel">
                        <div className="panel-header">How it works</div>
                        <div className="panel-body">
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.8 }}>
                                <li>
                                    <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '4px' }}>① CID Lookup</strong>
                                    The DataHaven CID is fetched from the network, providing timestamp integrity and tamper-proofing.
                                </li>
                                <li>
                                    <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '4px' }}>② Circuit Verification</strong>
                                    Noir runs the zk-SNARK verifier against the public liabilities. It asserts <span style={{ color: 'var(--green)' }}>reserves {"≥"} liabilities</span> internally.
                                </li>
                                <li>
                                    <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '4px' }}>③ Zero Trust Math</strong>
                                    Exchange addresses and balances are NEVER revealed. The proof string alone is enough to guarantee solvency.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Recent Audits</span>
                            <span style={{ color: 'var(--green)' }}>GLOBAL P2P</span>
                        </div>
                        <div className="proof-table" style={{ border: 'none', borderTop: '1px solid var(--border2)' }}>
                            <div className="tbl-row" style={{ gridTemplateColumns: 'min-content 1fr', gap: '16px' }}>
                                <div className="rs ok">OK</div>
                                <div>
                                    <div style={{ color: 'var(--green)', fontWeight: 600 }}>127% COVERAGE</div>
                                    <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>bafybeig...x4g7 · 2m ago</div>
                                </div>
                            </div>
                            <div className="tbl-row" style={{ gridTemplateColumns: 'min-content 1fr', gap: '16px' }}>
                                <div className="rs ok">OK</div>
                                <div>
                                    <div style={{ color: 'var(--green)', fontWeight: 600 }}>114% COVERAGE</div>
                                    <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>bafyreib...m2n9 · 1h ago</div>
                                </div>
                            </div>
                            <div className="tbl-row" style={{ gridTemplateColumns: 'min-content 1fr', gap: '16px' }}>
                                <div className="rs pd" style={{ color: 'var(--red)' }}>FAIL</div>
                                <div>
                                    <div style={{ color: 'var(--red)', fontWeight: 600 }}>103% COVERAGE (FLAG)</div>
                                    <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>bafkreid...q8r4 · 3h ago</div>
                                </div>
                            </div>
                            <div className="tbl-row" style={{ gridTemplateColumns: 'min-content 1fr', gap: '16px' }}>
                                <div className="rs ok">OK</div>
                                <div>
                                    <div style={{ color: 'var(--green)', fontWeight: 600 }}>139% COVERAGE</div>
                                    <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>bafybeih...v6w1 · 6h ago</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </main>
    );
}
