"use client";

import { useSharedState } from "@/hooks/useSharedState";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function HistoryPage() {
    const [proofHistory] = useSharedState<any[]>("pob-history", []);
    const [isGenerating, setIsGenerating] = useState(false);
    const [auditReport, setAuditReport] = useState<string | null>(null);

    const handleGenerateAudit = async () => {
        setIsGenerating(true);
        setAuditReport(null);

        try {
            const response = await fetch('/api/generate-audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proofs: proofHistory })
            });
            const data = await response.json();

            if (data.success) {
                setAuditReport(data.report);
            } else {
                alert("AI Engine Error: " + data.error);
            }
        } catch (error) {
            console.error("Failed to generate audit", error);
            alert("Failed to connect to the AI Auditor Engine.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <main className="app-content">
            <div className="sec-hdr" style={{ marginBottom: '40px' }}>
                <div>
                    <div className="sec-num">// PROOF LEDGER</div>
                    <div className="sec-title">History & <span className="hl">AI Audit</span></div>
                </div>
                <div className="sec-meta">
                    <button
                        className="btn-primary"
                        onClick={handleGenerateAudit}
                        disabled={isGenerating || proofHistory.length === 0}
                        style={{ fontSize: '10px', padding: '10px 20px', background: isGenerating ? 'transparent' : 'var(--green)', color: isGenerating ? 'var(--green)' : '#000' }}
                    >
                        {isGenerating ? "● SYNTHESIZING..." : "→ GENERATE RAG AUDIT"}
                    </button>
                </div>
            </div>

            <div className="panel" style={{ marginBottom: '40px' }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Generated Proofs</span>
                    <span style={{ color: 'var(--green)' }}>● LOCAL BROWSER SESSION</span>
                </div>

                {proofHistory.length === 0 ? (
                    <div className="panel-body" style={{ textAlign: "center", color: "var(--muted)", fontSize: "11px", padding: '60px 20px' }}>
                        No proofs generated yet. Route to [ISSUER] to construct cryptographic commitments.
                    </div>
                ) : (
                    <div className="proof-table" style={{ border: 'none', borderTop: '1px solid var(--border2)' }}>
                        <div className="tbl-head" style={{ gridTemplateColumns: 'min-content 1.5fr 1fr 1fr 2fr 1.5fr' }}>
                            <span>STATUS</span><span>TIME</span><span>INSTITUTION</span><span>COVERAGE/ASSETS</span><span>CID / ON-CHAIN HASH</span><span>VERDICT</span>
                        </div>
                        {proofHistory.map((entry) => (
                            <div className="tbl-row" style={{ gridTemplateColumns: 'min-content 1.5fr 1fr 1fr 2fr 1.5fr' }} key={entry.id}>
                                <div className={`rs ${entry.status === 'Valid' ? 'ok' : 'pd'}`} style={{ color: entry.status === 'Valid' ? 'var(--green)' : 'var(--red)' }}>
                                    {entry.status === 'Valid' ? 'OK' : 'ERR'}
                                </div>
                                <div style={{ color: "var(--muted)" }}>
                                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                                <div style={{ fontWeight: 600 }}>{entry.institution || "ZeroVault"}</div>
                                <div>
                                    <div style={{ color: entry.status === 'Valid' ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{entry.coverage}%</div>
                                    <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>${(entry.assets / 1e6).toFixed(1)}M</div>
                                </div>
                                <div>
                                    <div className="rhash" style={{ color: "var(--emerald)" }}>{entry.cid.slice(0, 10)}...{entry.cid.slice(-8)}</div>
                                    <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>
                                        {entry.txHash ? (
                                            <a href={`https://sepolia.etherscan.io/tx/${entry.txHash}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>
                                                {entry.txHash.slice(0, 10)}...{entry.txHash.slice(-8)}
                                            </a>
                                        ) : (
                                            "PENDING ANCHOR"
                                        )}
                                    </div>
                                </div>
                                <div>
                                    {entry.status === 'Valid' ? (
                                        <span style={{ fontSize: '9px', letterSpacing: '.1em', color: '#000', background: 'var(--green)', padding: '2px 6px' }}>✓ VALID</span>
                                    ) : (
                                        <span style={{ fontSize: '9px', letterSpacing: '.1em', color: 'var(--red)', background: 'rgba(204,51,51,0.1)', border: '1px solid rgba(204,51,51,0.2)', padding: '2px 6px' }}>⚠ REVIEW</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI RAG Report Modal */}
            {auditReport && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div className="panel" style={{
                        width: '100%',
                        maxWidth: '700px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 0 40px rgba(0, 201, 122, 0.1)',
                    }}>
                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg2)' }}>
                            <span style={{ color: 'var(--green)' }}>● AI AUDITOR ASSESSMENT</span>
                            <button
                                onClick={() => setAuditReport(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '14px' }}
                            >
                                [X]
                            </button>
                        </div>

                        <div style={{
                            padding: '30px',
                            overflowY: 'auto',
                            color: 'var(--text)',
                            lineHeight: '1.8',
                            fontSize: '11px',
                            fontFamily: 'IBM Plex Mono, monospace'
                        }}>
                            <ReactMarkdown>
                                {auditReport}
                            </ReactMarkdown>
                        </div>

                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border2)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg)' }}>
                            <button className="btn-secondary" onClick={() => setAuditReport(null)}>
                                CLOSE_REPORT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
