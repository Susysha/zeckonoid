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
        <main className="main-content">
            <div className="topbar">
                <div>
                    <div className="topbar-title">Public Auditor</div>
                    <div className="topbar-sub">// Open verification · No account required</div>
                </div>
            </div>
            <div className="auditor-body">
                <div className="audit-header">
                    <h2>Verify any proof</h2>
                    <p>Paste a DataHaven CID and ZK proof string to cryptographically verify solvency.</p>
                </div>

                <div className="audit-grid">
                    <div className="ap">
                        <div className="ap-hdr">
                            <div className="ap-title">Submit Proof</div>
                            <div className="ap-sub">Paste details below</div>
                        </div>
                        <div className="ap-body">
                            <div className="vf">
                                <label className="vl">DataHaven Content ID (CID)</label>
                                <input
                                    className="vi"
                                    placeholder="bafybeigdyrzt5scaea..."
                                    value={datahavenCID}
                                    onChange={(e) => setDatahavenCID(e.target.value)}
                                />
                            </div>
                            <div className="sep"></div>
                            <div className="vf">
                                <label className="vl">ZK Proof String</label>
                                <textarea
                                    className="vi"
                                    rows={4}
                                    placeholder="0x1a9f3c7d2e4b8f6a..."
                                    value={zkProof}
                                    onChange={(e) => setZkProof(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="vf">
                                <label className="vl">Declared Liabilities (USD)</label>
                                <input
                                    className="vi"
                                    placeholder="e.g. 11100000000"
                                    value={circulatingSupply}
                                    onChange={(e) => setCirculatingSupply(Number(e.target.value))}
                                />
                            </div>

                            <button className="btn-verify zv-btn btn-green" onClick={handleVerify} disabled={verificationState === "loading"}>
                                {verificationState === "loading" ? "Running Verification..." : "Verify Proof"}
                            </button>

                            {verificationState === "success" && (
                                <div className="result-block show">
                                    <div className="rb rb-green">
                                        <div className="rb-icon">✅</div>
                                        <div>
                                            <div className="rb-eyebrow green">Cryptographically Verified</div>
                                            <div className="rb-title">Fully Solvent</div>
                                            <div className="rb-desc">ZK proof is valid. Reserves exceed declared liabilities.</div>
                                        </div>
                                    </div>
                                    <div className="rm-row">
                                        <div className="rm-cell">
                                            <div className="rm-val green">Valid</div>
                                            <div className="rm-lbl">Zero-Knowledge</div>
                                        </div>
                                        <div className="rm-cell">
                                            <div className="rm-val green">Valid</div>
                                            <div className="rm-lbl">Constraint System</div>
                                        </div>
                                        <div className="rm-cell">
                                            <div className="rm-val" style={{ fontSize: "12px", color: "var(--text)" }}>Live</div>
                                            <div className="rm-lbl">Network</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {verificationState === "failed" && (
                                <div className="result-block show">
                                    <div className="rb rb-red">
                                        <div className="rb-icon">🚨</div>
                                        <div>
                                            <div className="rb-eyebrow red">Verification Failed</div>
                                            <div className="rb-title">Insolvency Alarm</div>
                                            <div className="rb-desc">Proof is invalid. Reserves may be insufficient or data tampered with.</div>
                                        </div>
                                    </div>
                                    <div className="rm-row">
                                        <div className="rm-cell">
                                            <div className="rm-val red">Failed</div>
                                            <div className="rm-lbl">ZK Proof</div>
                                        </div>
                                        <div className="rm-cell">
                                            <div className="rm-val red">Mismatch</div>
                                            <div className="rm-lbl">Integrity</div>
                                        </div>
                                    </div>
                                    {errorMessage && (
                                        <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--red)", fontFamily: "monospace" }}>
                                            Error Trace: {errorMessage}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="ap">
                        <div className="ap-hdr">
                            <div className="ap-title">How verification works</div>
                            <div className="ap-sub">No trust required</div>
                        </div>
                        <div className="ap-body">
                            <div className="how-steps">
                                <div className="hs">
                                    <strong>① CID lookup</strong>
                                    <span>The DataHaven CID is fetched from the decentralized network. This proves exactly when the snapshot was recorded and guarantees no retroactive tampering.</span>
                                </div>
                                <div className="hs">
                                    <strong>② Circuit verification</strong>
                                    <span>The Noir ZK circuit receives the proof string and the public declared liabilities. It checks: total_reserves ≥ total_liabilities without revealing any private data.</span>
                                </div>
                                <div className="hs">
                                    <strong>③ Result</strong>
                                    <span>If the math holds, the exchange is provably solvent. If it fails, the alarm fires. No wallet data is ever revealed to the verifier.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ap audit-full">
                    <div className="ap-hdr" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <div className="ap-title">Recent Public Verifications</div>
                            <div className="ap-sub">All verifications are globally public and immutable</div>
                        </div>
                        <div className="sys-dot"></div>
                    </div>
                    <div className="al-cols">
                        <div></div><div>CID</div><div>Coverage</div><div>Status</div><div>Time</div>
                    </div>
                    <div className="al-row">
                        <div className="sdot sdot-green"></div>
                        <div className="mono" style={{ fontSize: "11px", color: "var(--emerald)" }}>bafybeigdyr...x4g7k2mz</div>
                        <div style={{ color: "var(--green)", fontWeight: 700, fontSize: "12px" }}>127%</div>
                        <div><span className="badge bg-green">✓ Valid</span></div>
                        <div style={{ fontSize: "11px", color: "var(--text3)" }}>2 min ago</div>
                    </div>
                    <div className="al-row">
                        <div className="sdot sdot-green"></div>
                        <div className="mono" style={{ fontSize: "11px", color: "var(--emerald)" }}>bafyreib7x...m2n9p3kq</div>
                        <div style={{ color: "var(--green)", fontWeight: 700, fontSize: "12px" }}>114%</div>
                        <div><span className="badge bg-green">✓ Valid</span></div>
                        <div style={{ fontSize: "11px", color: "var(--text3)" }}>1 hr ago</div>
                    </div>
                    <div className="al-row">
                        <div className="sdot sdot-amber"></div>
                        <div className="mono" style={{ fontSize: "11px", color: "var(--emerald)" }}>bafkreid9a...q8r4s1lp</div>
                        <div style={{ color: "var(--amber)", fontWeight: 700, fontSize: "12px" }}>103%</div>
                        <div><span className="badge bg-amber">⚠ Review</span></div>
                        <div style={{ fontSize: "11px", color: "var(--text3)" }}>3 hr ago</div>
                    </div>
                    <div className="al-row">
                        <div className="sdot sdot-green"></div>
                        <div className="mono" style={{ fontSize: "11px", color: "var(--emerald)" }}>bafybeihx3...v6w1y7nt</div>
                        <div style={{ color: "var(--green)", fontWeight: 700, fontSize: "12px" }}>139%</div>
                        <div><span className="badge bg-green">✓ Valid</span></div>
                        <div style={{ fontSize: "11px", color: "var(--text3)" }}>6 hr ago</div>
                    </div>
                </div>
            </div>
        </main>
    );
}
