"use client";

import { useState } from "react";
import { encryptAndUploadToDataHaven } from "@/utils/datahaven";
import { generateNoirProof } from "@/utils/noir";
import { useSharedState } from "@/hooks/useSharedState";

export default function IssuerPage() {
    // Developer Wallet State
    const [privateKey, setPrivateKey] = useState<string>("0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133");

    // Globally sync across tabs via localStorage custom hook
    const [circulatingSupply, setCirculatingSupply] = useSharedState<number>("pob-circulating-supply", 5000000);
    const [reserves, setReserves] = useSharedState<{ id: string; name: string; amount: number; type: 'fiat' | 'crypto' | 'tbill' }[]>("pob-reserves", [
        { id: "1", name: "Treasury T-Bills", amount: 2000000, type: 'tbill' },
        { id: "2", name: "Cold Wallet BTC", amount: 3000000, type: 'crypto' },
        { id: "3", name: "Vault Cash", amount: 500000, type: 'fiat' },
    ]);

    // Processing State
    const [isLoading, setIsLoading] = useState(false);
    const [datahavenCID, setDatahavenCID] = useState<string | null>(null);
    const [zkProof, setZkProof] = useState<string | null>(null);

    // Sidebar Oracle State
    const [tradeAmount, setTradeAmount] = useState<number>(100000);

    // Derived Financials
    const totalReserves = reserves.reduce((acc, r) => acc + r.amount, 0);
    const isBacked = totalReserves >= circulatingSupply;
    const collateralizationRatio = ((totalReserves / circulatingSupply) * 100).toFixed(0);

    const handleSealAndProve = async () => {
        setIsLoading(true);
        setDatahavenCID(null);
        setZkProof(null);

        const payload = {
            timestamp: Date.now(),
            circulatingSupply,
            reservesBreakdown: reserves,
        };

        try {
            const dhResult = await encryptAndUploadToDataHaven(payload, privateKey);
            setDatahavenCID(dhResult.cid);

            const amounts = reserves.map((r) => r.amount);
            const proofStr = await generateNoirProof(amounts, circulatingSupply);
            setZkProof(proofStr);
        } catch (e: any) {
            console.error(e);
            alert("Error generating proof or uploading to DataHaven.");
        }
        setIsLoading(false);
    };

    const handleBuyProtocolToken = () => setCirculatingSupply((prev) => prev + tradeAmount);
    const handleSellProtocolToken = () => setCirculatingSupply((prev) => Math.max(1000, prev - tradeAmount));
    const handleBtcPriceChange = (percentage: number) => {
        setReserves(prevReserves => prevReserves.map(r => {
            if (r.type === "crypto") {
                const change = r.amount * percentage;
                return { ...r, amount: Math.max(0, Math.floor(r.amount + change)) };
            }
            return r;
        }));
    };

    return (
        <main className="main-content">
            <div className="topbar">
                <div>
                    <div className="topbar-title">Issue Proof · Organization</div>
                    <div className="topbar-sub">// Encrypt → Upload → Prove → Submit</div>
                </div>
                <div className="topbar-right">
                    <button className="zv-btn btn-ghost">Import CSV</button>
                    <button className="zv-btn btn-ghost">Save Draft</button>
                    <button className="zv-btn btn-sim" onClick={handleSealAndProve} disabled={isLoading}>
                        {isLoading ? "Generating..." : "▶ Run Proof Engine"}
                    </button>
                </div>
            </div>
            <div className="issuer-body">
                <div className="issuer-main">
                    <div className="metric-strip">
                        <div className="mc">
                            <div className="mc-label">Total Liabilities</div>
                            <div className="mc-value amber">${(circulatingSupply / 1e6).toFixed(1)}M</div>
                            <div className="mc-sub">Declared obligations</div>
                        </div>
                        <div className="mc">
                            <div className="mc-label">Reserve Assets</div>
                            <div className="mc-value green">${(totalReserves / 1e6).toFixed(1)}M</div>
                            <div className="mc-sub">{reserves.length} wallets declared</div>
                        </div>
                        <div className="mc">
                            <div className="mc-label">Coverage Ratio</div>
                            <div className={`mc-value ${isBacked ? 'green' : 'red'}`}>{collateralizationRatio}%</div>
                            <div className="mc-sub">{isBacked ? 'Above threshold' : 'Insolvent!'}</div>
                        </div>
                        <div className="mc">
                            <div className="mc-label">Proof Status</div>
                            <div className="mc-value muted">{isLoading ? 'Processing...' : 'Ready to Generate'}</div>
                            <div className="mc-sub">All inputs valid</div>
                        </div>
                    </div>

                    <div className="fblock">
                        <div className="fb-hdr">
                            <div>
                                <div className="fb-title">Liability Declaration</div>
                                <div className="fb-sub">Public input — included in proof output</div>
                            </div>
                            <span className="fb-tag">public_input</span>
                        </div>
                        <div className="fb-body">
                            <div className="field-grid">
                                <div className="field">
                                    <label className="fl">Total User Liabilities ($POC)</label>
                                    <input className="fi" value={circulatingSupply} readOnly />
                                </div>
                                <div className="field">
                                    <label className="fl">Snapshot Timestamp</label>
                                    <input className="fi" value={new Date().toISOString()} readOnly />
                                </div>
                            </div>
                            <div className="field-grid">
                                <div className="field">
                                    <label className="fl">Private Key</label>
                                    <input className="fi" type="password" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
                                </div>
                                <div className="field">
                                    <label className="fl">Proof Version</label>
                                    <input className="fi" value="Noir v0.31" readOnly />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="fblock">
                        <div className="fb-hdr">
                            <div>
                                <div className="fb-title">Reserve Assets</div>
                                <div className="fb-sub">Private inputs — AES-256 encrypted before DataHaven upload</div>
                            </div>
                            <span className="fb-tag">private_input</span>
                        </div>
                        <div style={{ overflow: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Asset / Wallet</th>
                                        <th>Type</th>
                                        <th>Balance (USD)</th>
                                        <th>Share</th>
                                        <th>Encryption</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reserves.map(reserve => {
                                        const share = totalReserves > 0 ? ((reserve.amount / totalReserves) * 100).toFixed(1) : "0.0";
                                        return (
                                            <tr key={reserve.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{reserve.name}</div>
                                                    <div className="mono" style={{ color: "var(--text3)", fontSize: "10px", marginTop: "1px" }}>
                                                        {reserve.id === "1" ? "Treasury Dept" : reserve.id === "2" ? "bc1q••••••••4a9d" : "Fiat Vault"}
                                                    </div>
                                                </td>
                                                <td><span className="badge bg-gray">{reserve.type.toUpperCase()}</span></td>
                                                <td style={{ fontWeight: 600, color: "var(--green)" }}>${reserve.amount.toLocaleString()}</td>
                                                <td style={{ color: "var(--text3)" }}>{share}%</td>
                                                <td><span className="badge bg-green">✓ AES-256</span></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: "9px 16px" }}>
                            <button className="zv-btn btn-ghost" style={{ fontSize: "11px", width: "100%", borderStyle: "dashed" }}>+ Add Wallet / Asset</button>
                        </div>
                    </div>

                    <div className="fblock">
                        <div className="fb-hdr">
                            <div>
                                <div className="fb-title">Generation Pipeline</div>
                                <div className="fb-sub">Cryptographic Workflow</div>
                            </div>
                        </div>
                        <div className="fb-body">
                            <div className="pipeline">
                                <div className={`ps ${datahavenCID ? 'done' : isLoading ? 'active' : ''}`}>
                                    <div className="ps-step">Step 1</div>
                                    <div className="ps-name">DataHaven Upload</div>
                                    <div className={`ps-stat ${datahavenCID ? 'done' : isLoading ? 'active' : 'wait'}`}>
                                        {datahavenCID ? '✓ Complete' : isLoading ? '● Processing' : '○ Waiting'}
                                    </div>
                                </div>
                                <div className={`ps ${zkProof ? 'done' : (isLoading && datahavenCID) ? 'active' : ''}`}>
                                    <div className="ps-step">Step 2</div>
                                    <div className="ps-name">Run Noir Circuit</div>
                                    <div className={`ps-stat ${zkProof ? 'done' : (isLoading && datahavenCID) ? 'active' : 'wait'}`}>
                                        {zkProof ? '✓ Complete' : (isLoading && datahavenCID) ? '● Proving' : '○ Waiting'}
                                    </div>
                                </div>
                            </div>

                            {datahavenCID && (
                                <div className="code-block">
                                    <div className="cb-label">DataHaven CID</div>
                                    <div className="cb-val">{datahavenCID}</div>
                                </div>
                            )}

                            {zkProof && (
                                <div className="code-block" style={{ marginTop: '10px' }}>
                                    <div className="cb-label">Noir Zero-Knowledge Proof String</div>
                                    <div className="cb-val">{zkProof}</div>
                                </div>
                            )}

                            <div className="act-row">
                                <button className="zv-btn btn-green" onClick={handleSealAndProve} disabled={isLoading}>
                                    ⚡ {isLoading ? "Processing..." : "Generate ZK Proof"}
                                </button>
                                <span style={{ fontSize: "11px", color: "var(--text3)" }}>Est. ~0.8s · Noir Barretenberg</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Oracle */}
                <div className="issuer-sidebar" id="live-sb">
                    <div className="isb-header">
                        <div className="isb-title">Oracle Feed <span className="live-badge">LIVE</span></div>
                    </div>

                    <div className="gauge-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="gauge-lbl">Market Actions</div>
                        <div style={{ marginBottom: "15px" }}>
                            <label className="fl" style={{ marginBottom: "5px", display: "block" }}>Trade Amount ($POC)</label>
                            <input
                                type="number"
                                className="fi"
                                value={tradeAmount}
                                onChange={(e) => setTradeAmount(Number(e.target.value))}
                                style={{ fontSize: "16px", fontWeight: "bold", padding: "10px" }}
                            />
                        </div>
                        <div className="gauge-row">
                            <button className="zv-btn" onClick={handleBuyProtocolToken} style={{ background: "var(--emerald-dim)", color: "var(--green)", border: "1px solid rgba(34,197,94,.2)" }}>BUY VOL</button>
                            <button className="zv-btn" onClick={handleSellProtocolToken} style={{ background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(239,68,68,.2)" }}>SELL VOL</button>
                        </div>
                    </div>

                    <div className="gauge-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="gauge-lbl">External Shocks</div>
                        <div className="how-steps" style={{ marginTop: "10px" }}>
                            <button className="hs" onClick={() => handleBtcPriceChange(0.05)} style={{ borderLeftColor: "var(--green)", cursor: "pointer", textAlign: "left", background: "transparent", border: "1px solid var(--border)", borderLeft: "3px solid var(--green)" }}>
                                <strong>Bull Market</strong>
                                <span>BTC Value +5%</span>
                            </button>
                            <button className="hs" onClick={() => handleBtcPriceChange(-0.15)} style={{ borderLeftColor: "var(--red)", cursor: "pointer", textAlign: "left", background: "transparent", border: "1px solid var(--border)", borderLeft: "3px solid var(--red)" }}>
                                <strong>Flash Crash</strong>
                                <span>BTC Value -15%</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
