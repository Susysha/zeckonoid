"use client";

import { useSharedState } from "@/hooks/useSharedState";

export default function HistoryPage() {
    const [proofHistory] = useSharedState<any[]>("pob-history", []);

    return (
        <main className="main-content">
            <div className="topbar">
                <div>
                    <div className="topbar-title">Proof History</div>
                    <div className="topbar-sub">// Cryptographically verified solvency records</div>
                </div>
            </div>
            <div className="overview-body">
                <div className="table-card" style={{ marginTop: "20px" }}>
                    <div className="tc-header">
                        <div className="tc-title">Generated Proofs</div>
                        <div className="tc-sub">All proofs generated locally in this browser session</div>
                    </div>
                    {proofHistory.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text3)", fontSize: "12px" }}>
                            No proofs generated yet. Go to the Issue Proof page to begin.
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Time</th>
                                    <th>Institution</th>
                                    <th>Coverage</th>
                                    <th>Assets</th>
                                    <th>DataHaven CID</th>
                                    <th>On-Chain Hash</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proofHistory.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>
                                            <span className={`sdot ${entry.status === 'Valid' ? 'sdot-green' : 'sdot-amber'}`}></span>
                                        </td>
                                        <td style={{ color: "var(--text3)" }}>
                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </td>
                                        <td><strong>{entry.institution || "ZeroVault"}</strong></td>
                                        <td style={{ color: entry.status === 'Valid' ? "var(--green)" : "var(--amber)", fontWeight: 700 }}>
                                            {entry.coverage}%
                                        </td>
                                        <td>${(entry.assets / 1e6).toFixed(1)}M</td>
                                        <td className="mono" style={{ color: "var(--emerald)", fontSize: "11px" }}>
                                            {entry.cid.slice(0, 10)}...{entry.cid.slice(-8)}
                                        </td>
                                        <td className="mono" style={{ color: "var(--text2)", fontSize: "11px" }}>
                                            {entry.txHash ? (
                                                <a href={`https://sepolia.etherscan.io/tx/${entry.txHash}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                                                    {entry.txHash.slice(0, 6)}...{entry.txHash.slice(-4)}
                                                </a>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${entry.status === 'Valid' ? 'bg-green' : 'bg-amber'}`}>
                                                {entry.status === 'Valid' ? '✓ Valid' : '⚠ Review'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </main>
    );
}
