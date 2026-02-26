"use client";

import { useState } from "react";
import { encryptAndUploadToDataHaven } from "@/utils/datahaven";
import { generateNoirProof } from "@/utils/noir";
import { useSharedState } from "@/hooks/useSharedState";

// ─── Simulated wallet list ──────────────────────────────────────────────────
const SIMULATED_WALLETS = [
    { name: "MetaMask", icon: "🦊", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" },
    { name: "WalletConnect", icon: "🔗", address: "0x3A4E43d5e3C32E2F35d0aFd5c7e2Ff10b4a927cC" },
    { name: "Coinbase Wallet", icon: "🔵", address: "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc" },
    { name: "Ledger", icon: "🔒", address: "0x55FE002aeff02F77364de339a1292923A15844B8" },
];

const TYPE_COLORS: Record<string, string> = { fiat: "#7eb8f7", crypto: "#f7c660", tbill: "#00c97a" };

export default function IssuerPage() {
    // ── Wallet State ──────────────────────────────────────────────────────────
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [connectedWallet, setConnectedWallet] = useState<typeof SIMULATED_WALLETS[0] | null>(null);
    const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

    // ── Globally synced state ─────────────────────────────────────────────────
    const [circulatingSupply, setCirculatingSupply] = useSharedState<number>("pob-supply-v2", 5000000);
    const [reserves, setReserves] = useSharedState<{ id: string; name: string; amount: number; type: "fiat" | "crypto" | "tbill" }[]>(
        "pob-reserves-v2",
        [
            { id: "1", name: "Treasury T-Bills", amount: 2000000, type: "tbill" },
            { id: "2", name: "Cold Wallet BTC", amount: 3000000, type: "crypto" },
            { id: "3", name: "Vault Cash", amount: 500000, type: "fiat" },
        ]
    );

    // ── Asset editing ─────────────────────────────────────────────────────────
    const [editingId, setEditingId] = useState<string | null>(null);

    const updateReserve = (id: string, field: "name" | "amount" | "type", value: string | number) =>
        setReserves(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

    const addReserve = () => {
        const newId = Date.now().toString();
        setReserves(prev => [...prev, { id: newId, name: "New Asset", amount: 0, type: "fiat" }]);
        setEditingId(newId);
    };

    const removeReserve = (id: string) => setReserves(prev => prev.filter(r => r.id !== id));

    // ── Processing State ──────────────────────────────────────────────────────
    const [isLoading, setIsLoading] = useState(false);
    const [isAnchoring, setIsAnchoring] = useState(false);
    const [datahavenCID, setDatahavenCID] = useState<string | null>(null);
    const [zkProof, setZkProof] = useState<string | null>(null);
    const [anchoredTx, setAnchoredTx] = useState<string | null>(null);
    const [proofHistory, setProofHistory] = useSharedState<any[]>("pob-history", []);

    // ── Sidebar Oracle State ──────────────────────────────────────────────────
    const [tradeAmount, setTradeAmount] = useState<number>(100000);

    // ── Derived Financials (live) ─────────────────────────────────────────────
    const totalReserves = reserves.reduce((acc, r) => acc + r.amount, 0);
    const isBacked = totalReserves >= circulatingSupply;
    const collateralizationRatio = circulatingSupply > 0
        ? ((totalReserves / circulatingSupply) * 100).toFixed(0)
        : "0";

    // ── Wallet Connect Handler ────────────────────────────────────────────────
    const handleConnectWallet = (wallet: typeof SIMULATED_WALLETS[0]) => {
        setConnectingWallet(wallet.name);
        setTimeout(() => {
            setConnectedWallet(wallet);
            setConnectingWallet(null);
            setWalletModalOpen(false);
        }, 1200);
    };

    // ── Seal & Prove ──────────────────────────────────────────────────────────
    const handleSealAndProve = async () => {
        if (!connectedWallet) { setWalletModalOpen(true); return; }
        if (!isBacked) {
            alert(`INSOLVENCY SHUTDOWN: Total Reserves ($${(totalReserves / 1e6).toFixed(1)}M) must be >= Declared Liabilities ($${(circulatingSupply / 1e6).toFixed(1)}M).`);
            return;
        }

        setIsLoading(true);
        setDatahavenCID(null); setZkProof(null); setAnchoredTx(null);

        const payload = { timestamp: Date.now(), circulatingSupply, reservesBreakdown: reserves };

        try {
            const dhResult = await encryptAndUploadToDataHaven(payload, connectedWallet.address);
            setDatahavenCID(dhResult.cid);

            const amounts = reserves.map(r => r.amount);
            const proofStr = await generateNoirProof(amounts, circulatingSupply);
            setZkProof(proofStr);

            let currentTxHash: string | null = null;
            setIsAnchoring(true);
            try {
                const { anchorProofOnChain } = await import("@/utils/anchoring");
                currentTxHash = await anchorProofOnChain(dhResult.cid, proofStr);
                setAnchoredTx(currentTxHash);
            } catch (anchorErr: any) {
                console.warn("Auto-anchoring failed:", anchorErr);
            }
            setIsAnchoring(false);

            setProofHistory(prev => [{
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                cid: dhResult.cid, proof: proofStr,
                coverage: collateralizationRatio,
                assets: totalReserves,
                status: isBacked ? "Valid" : "Review",
                institution: "ZeroVault Demo",
                txHash: currentTxHash,
            }, ...prev]);
        } catch (e: any) {
            console.error(e);
            alert("Error generating proof or uploading to DataHaven.");
        }
        setIsLoading(false);
    };

    const handleAnchorOnChain = async () => {
        if (!datahavenCID || !zkProof) return;
        setIsAnchoring(true);
        try {
            const { anchorProofOnChain } = await import("@/utils/anchoring");
            const hash = await anchorProofOnChain(datahavenCID, zkProof);
            setAnchoredTx(hash);
            setProofHistory(prev => {
                if (!prev.length) return prev;
                const n = [...prev]; n[0] = { ...n[0], txHash: hash }; return n;
            });
        } catch (e: any) { alert(e.message || "Error anchoring."); }
        setIsAnchoring(false);
    };

    const handleBuyProtocolToken = () => setCirculatingSupply(p => p + tradeAmount);
    const handleSellProtocolToken = () => setCirculatingSupply(p => Math.max(1000, p - tradeAmount));
    const handleBtcPriceChange = (pct: number) =>
        setReserves(prev => prev.map(r =>
            r.type === "crypto" ? { ...r, amount: Math.max(0, Math.floor(r.amount * (1 + pct))) } : r
        ));

    return (
        <main className="app-content">

            {/* ── Wallet Connect Modal ────────────────────────────────────── */}
            {walletModalOpen && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 9999,
                    background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <div style={{ width: 420, background: "var(--bg1)", border: "1px solid var(--border)", position: "relative" }}>
                        <span className="corner c-tl" /><span className="corner c-tr" />
                        <span className="corner c-bl" /><span className="corner c-br" />
                        <div className="code-hdr" style={{ padding: "14px 20px" }}>
                            <span>Connect Wallet</span>
                            <button onClick={() => setWalletModalOpen(false)}
                                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14 }}>✕</button>
                        </div>
                        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.1em" }}>
                                SELECT PROVIDER — SIMULATION MODE
                            </div>
                            {SIMULATED_WALLETS.map(w => (
                                <button key={w.name} className="nav-btn"
                                    onClick={() => handleConnectWallet(w)}
                                    disabled={connectingWallet === w.name}
                                    style={{
                                        width: "100%", textAlign: "left",
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "14px 16px", fontSize: 12,
                                        opacity: connectingWallet && connectingWallet !== w.name ? 0.4 : 1,
                                    }}>
                                    <span style={{ fontSize: 18 }}>{w.icon}</span>
                                    <span style={{ flex: 1 }}>{w.name}</span>
                                    {connectingWallet === w.name
                                        ? <span style={{ color: "var(--green)", fontSize: 10 }}>CONNECTING...</span>
                                        : <span style={{ color: "var(--muted)", fontSize: 10 }}>SIMULATED</span>}
                                </button>
                            ))}
                            <div style={{ marginTop: 12, fontSize: 9, color: "var(--muted)", lineHeight: 1.8, borderTop: "1px solid var(--border2)", paddingTop: 12 }}>
                                Simulation only — no real transactions, no real keys.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="sec-hdr" style={{ marginBottom: "40px" }}>
                <div>
                    <div className="sec-num">// ISSUER NODE</div>
                    <div className="sec-title">Generate <span className="hl">Proof</span></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                    {connectedWallet ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                                fontSize: 9, color: "var(--green)", border: "1px solid var(--border)",
                                padding: "6px 14px", display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.08em",
                            }}>
                                <span style={{ fontSize: 13 }}>{connectedWallet.icon}</span>
                                <span>{connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}</span>
                                <span>● LIVE</span>
                            </div>
                            <button className="nav-btn" onClick={() => setConnectedWallet(null)}
                                style={{ fontSize: 9, padding: "6px 10px", borderColor: "var(--muted)", color: "var(--muted)" }}>
                                DISCONNECT
                            </button>
                        </div>
                    ) : (
                        <button className="nav-btn" onClick={() => setWalletModalOpen(true)} style={{ fontSize: 10 }}>
                            ⬡ CONNECT WALLET
                        </button>
                    )}
                    <button className="btn-primary" onClick={handleSealAndProve} disabled={isLoading}
                        style={{ fontSize: "10px", padding: "10px 20px" }}>
                        {isLoading ? "● PROCESSING..." : connectedWallet ? "→ RUN ENGINE" : "→ CONNECT & PROVE"}
                    </button>
                </div>
            </div>

            {/* ── Live Stats Bar ──────────────────────────────────────────── */}
            <div className="stats-bar" style={{ marginBottom: "40px", background: "var(--bg1)" }}>
                <div className="stat-cell vis">
                    <div className="sl">Total Liabilities</div>
                    <div className="sv" style={{ color: "var(--red)" }}>{(circulatingSupply / 1e6).toFixed(1)}<span className="u">M</span></div>
                    <div className="sc dn">Declared obligations</div>
                </div>
                <div className="stat-cell vis">
                    <div className="sl">Reserve Assets</div>
                    <div className="sv">{(totalReserves / 1e6).toFixed(1)}<span className="u">M</span></div>
                    <div className="sc up">{reserves.length} wallets declared</div>
                </div>
                <div className="stat-cell vis">
                    <div className="sl">Coverage Ratio</div>
                    <div className="sv" style={{ color: isBacked ? "var(--green)" : "var(--red)" }}>
                        {collateralizationRatio}<span className="u">%</span>
                    </div>
                    <div className={`sc ${isBacked ? "up" : "dn"}`}>{isBacked ? "● Above threshold" : "● Insolvent!"}</div>
                </div>
                <div className="stat-cell vis">
                    <div className="sl">Wallet</div>
                    <div className="sv" style={{ fontSize: 18, paddingTop: 8, lineHeight: 1.4 }}>
                        {connectedWallet
                            ? <span style={{ color: "var(--green)", fontSize: 13 }}>{connectedWallet.icon} {connectedWallet.name}</span>
                            : <span style={{ color: "var(--muted)", fontSize: 13 }}>NOT CONNECTED</span>}
                    </div>
                    <div className={`sc ${connectedWallet ? "up" : "dn"}`}>
                        {connectedWallet ? "● Signing ready" : "● Connect to prove"}
                    </div>
                </div>
            </div>

            <div className="live-grid">
                <div className="main-col" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* ── Liability Declaration ─────────────────────────── */}
                    <div className="panel">
                        <div className="panel-header" style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Liability Declaration</span>
                            <span style={{ color: "var(--green)" }}>● public_input</span>
                        </div>
                        <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div>
                                <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "8px", letterSpacing: "0.1em" }}>
                                    TOTAL LIABILITIES ($POC)
                                </div>
                                <input className="form-input" type="number" value={circulatingSupply}
                                    onChange={e => setCirculatingSupply(Math.max(0, Number(e.target.value)))} />
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "8px", letterSpacing: "0.1em" }}>
                                    SIGNING WALLET
                                </div>
                                {connectedWallet ? (
                                    <div className="form-input" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--green)", cursor: "default" }}>
                                        <span>{connectedWallet.icon}</span>
                                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 10 }}>
                                            {connectedWallet.address}
                                        </span>
                                    </div>
                                ) : (
                                    <button className="nav-btn" onClick={() => setWalletModalOpen(true)} style={{ width: "100%", textAlign: "center" }}>
                                        ⬡ CONNECT WALLET
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Reserve Assets (Editable) ─────────────────────── */}
                    <div className="panel">
                        <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Reserve Assets</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ color: "var(--green)", fontSize: 9 }}>● private_input (AES-256)</span>
                                <button className="nav-btn" onClick={addReserve}
                                    style={{ fontSize: 9, padding: "4px 10px", letterSpacing: "0.08em" }}>
                                    + ADD ASSET
                                </button>
                            </div>
                        </div>

                        <div className="tbl-head" style={{ gridTemplateColumns: "2fr 0.8fr 1.2fr 70px 36px" }}>
                            <span>ASSET / WALLET</span><span>TYPE</span><span>BALANCE (USD)</span><span>ENC</span><span></span>
                        </div>

                        {reserves.map(r => (
                            <div key={r.id} className="tbl-row"
                                style={{
                                    gridTemplateColumns: "2fr 0.8fr 1.2fr 70px 36px",
                                    alignItems: "center",
                                    background: editingId === r.id ? "rgba(0,201,122,0.03)" : undefined,
                                    transition: "background 0.2s",
                                }}>
                                {/* Name */}
                                {editingId === r.id ? (
                                    <input className="form-input" value={r.name} autoFocus
                                        onChange={e => updateReserve(r.id, "name", e.target.value)}
                                        onBlur={() => setEditingId(null)}
                                        style={{ fontSize: 11, padding: "4px 8px" }} />
                                ) : (
                                    <div style={{ fontWeight: 600, cursor: "pointer" }}
                                        title="Click to rename" onClick={() => setEditingId(r.id)}>
                                        {r.name}
                                        <span style={{ fontSize: 8, color: "var(--muted)", marginLeft: 6 }}>✎</span>
                                    </div>
                                )}

                                {/* Type */}
                                <select value={r.type} onChange={e => updateReserve(r.id, "type", e.target.value)}
                                    style={{
                                        background: "var(--bg2)", border: "1px solid var(--border2)",
                                        color: TYPE_COLORS[r.type], fontFamily: "inherit",
                                        fontSize: 9, letterSpacing: "0.08em", padding: "4px 6px", cursor: "pointer",
                                    }}>
                                    <option value="tbill">T-BILL</option>
                                    <option value="crypto">CRYPTO</option>
                                    <option value="fiat">FIAT</option>
                                </select>

                                {/* Amount */}
                                <input className="form-input" type="number" min={0} value={r.amount}
                                    onChange={e => updateReserve(r.id, "amount", Math.max(0, Number(e.target.value)))}
                                    style={{ fontSize: 11, padding: "4px 8px", color: "var(--green)" }} />

                                <div className="rs ok" style={{ fontSize: 9 }}>AES-256</div>

                                {/* Remove */}
                                <button onClick={() => removeReserve(r.id)} title="Remove"
                                    style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "4px", lineHeight: 1 }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--red)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)"; }}>
                                    ✕
                                </button>
                            </div>
                        ))}

                        {/* Totals row */}
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            padding: "12px 20px", borderTop: "1px solid var(--border2)",
                            background: isBacked ? "rgba(0,201,122,0.04)" : "rgba(204,51,51,0.04)",
                            fontSize: 11,
                        }}>
                            <span style={{ color: "var(--muted)", letterSpacing: "0.1em", fontSize: 9 }}>TOTAL RESERVE VALUE</span>
                            <span style={{ color: isBacked ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
                                ${totalReserves.toLocaleString()}
                                <span style={{ fontSize: 9, marginLeft: 8, color: "var(--muted)" }}>({collateralizationRatio}% coverage)</span>
                            </span>
                        </div>
                    </div>

                    {/* ── Pipeline Status ───────────────────────────────── */}
                    <div className="panel" style={{ marginBottom: "40px" }}>
                        <div className="panel-header">Pipeline Status</div>
                        <div className="panel-body">
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {[
                                    { label: "1. DataHaven Upload", done: !!datahavenCID, active: isLoading && !datahavenCID },
                                    { label: "2. Noir ZK Circuit Proving", done: !!zkProof, active: isLoading && !!datahavenCID },
                                    { label: "3. EVM On-Chain Anchor", done: !!anchoredTx, active: isAnchoring },
                                ].map((s, i) => (
                                    <div key={i} style={{ fontSize: "11px", display: "flex", justifyContent: "space-between", borderBottom: i < 2 ? "1px solid var(--border2)" : "none", paddingBottom: i < 2 ? "12px" : 0 }}>
                                        <span style={{ color: s.done ? "var(--green)" : "var(--muted)" }}>{s.label}</span>
                                        <span>{s.done ? "✓ Complete" : s.active ? "● Processing" : "○ Waiting"}</span>
                                    </div>
                                ))}
                            </div>

                            {datahavenCID && (
                                <div className="proof-panel" style={{ marginTop: "24px", gridTemplateColumns: "1fr" }}>
                                    <div className="code-hdr"><span>ARTIFACTS</span><span style={{ color: "var(--green)" }}>● 3 objects</span></div>
                                    <div className="code-body" style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
                                        <div className="code-line"><span className="kw">CID:</span> <span className="tc">{datahavenCID}</span></div>
                                        {zkProof && <div className="code-line" style={{ marginTop: "10px" }}><span className="kw">PROOF:</span> <span className="tc">{zkProof.substring(0, 60)}...</span></div>}
                                        {anchoredTx && <div className="code-line" style={{ marginTop: "10px" }}><span className="kw">TX:</span>    <span className="tc">{anchoredTx}</span></div>}
                                    </div>
                                </div>
                            )}

                            {zkProof && !anchoredTx && !isAnchoring && (
                                <button className="btn-secondary" onClick={handleAnchorOnChain}
                                    style={{ width: "100%", marginTop: "20px", justifyContent: "center" }}>
                                    Confirm On-Chain Anchor
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Sidebar ─────────────────────────────────────────────── */}
                <div className="sidebar">
                    <div className="s-card">
                        <div className="s-lbl">Oracle Feed <span>LIVE</span></div>
                        <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "20px", marginBottom: "8px", letterSpacing: "0.1em" }}>TRADE VOLUME ($POC)</div>
                        <input className="form-input" type="number" value={tradeAmount}
                            onChange={e => setTradeAmount(Number(e.target.value))} style={{ marginBottom: "16px" }} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <button className="nav-btn" onClick={handleBuyProtocolToken} style={{ color: "var(--green)", borderColor: "var(--green)", width: "100%", textAlign: "center" }}>BUY</button>
                            <button className="nav-btn" onClick={handleSellProtocolToken} style={{ color: "var(--red)", borderColor: "var(--red)", width: "100%", textAlign: "center" }}>SELL</button>
                        </div>
                    </div>

                    <div className="s-card">
                        <div className="s-lbl" style={{ marginBottom: "20px" }}>External Shocks <span style={{ color: "var(--muted)" }}>TEST</span></div>
                        <button className="nav-btn" onClick={() => handleBtcPriceChange(0.05)} style={{ width: "100%", marginBottom: "10px", textAlign: "left" }}>
                            BULL MARKET <span style={{ float: "right", color: "var(--green)" }}>+5%</span>
                        </button>
                        <button className="nav-btn" onClick={() => handleBtcPriceChange(-0.15)} style={{ width: "100%", textAlign: "left", borderColor: "var(--red)", color: "var(--red)" }}>
                            FLASH CRASH <span style={{ float: "right" }}>-15%</span>
                        </button>
                    </div>

                    {/* Live asset breakdown */}
                    <div className="s-card">
                        <div className="s-lbl" style={{ marginBottom: "16px" }}>Asset Breakdown</div>
                        {reserves.map(r => {
                            const pct = totalReserves > 0 ? (r.amount / totalReserves) * 100 : 0;
                            return (
                                <div key={r.id} style={{ marginBottom: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--muted)", marginBottom: 4, letterSpacing: "0.08em" }}>
                                        <span>{r.name}</span>
                                        <span style={{ color: TYPE_COLORS[r.type] }}>{pct.toFixed(0)}%</span>
                                    </div>
                                    <div style={{ height: 3, background: "var(--muted2)", borderRadius: 2 }}>
                                        <div style={{ height: "100%", width: `${pct}%`, background: TYPE_COLORS[r.type], transition: "width 0.4s ease", borderRadius: 2 }} />
                                    </div>
                                </div>
                            );
                        })}
                        {reserves.length === 0 && <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "center" }}>No assets declared</div>}
                    </div>
                </div>
            </div>
        </main>
    );
}
