"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { encryptAndUploadToDataHaven } from "@/utils/datahaven";
import { generateNoirProof } from "@/utils/noir";
import { useSharedState } from "@/hooks/useSharedState";

// Flash animation helper: adds a class, then removes it after the animation
function useFlash(value: unknown): [boolean, React.RefObject<boolean>] {
    const [flashing, setFlashing] = useState(false);
    const prevRef = useRef(value);
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            prevRef.current = value;
            return;
        }
        if (prevRef.current !== value) {
            prevRef.current = value;
            setFlashing(true);
            const t = setTimeout(() => setFlashing(false), 600);
            return () => clearTimeout(t);
        }
    }, [value]);

    return [flashing, firstRender];
}

function StatCell({
    label,
    value,
    unit,
    sublabel,
    sublabelClass,
    valueStyle,
}: {
    label: string;
    value: string | number;
    unit?: string;
    sublabel?: string;
    sublabelClass?: string;
    valueStyle?: React.CSSProperties;
}) {
    const [flashing] = useFlash(value);
    return (
        <div className="stat-cell vis">
            <div className="sl">{label}</div>
            <div className="sv" style={valueStyle}>
                <span style={flashing ? { animation: "flash-update 0.6s ease-out" } : {}}>
                    {value}
                </span>
                {unit && <span className="u">{unit}</span>}
            </div>
            {sublabel && <div className={`sc ${sublabelClass ?? ""}`}>{sublabel}</div>}
        </div>
    );
}

export default function IssuerPage() {
    const [privateKey, setPrivateKey] = useState<string>("");

    // Globally sync across tabs via localStorage custom hook
    const [circulatingSupply, setCirculatingSupply] = useSharedState<number>("pob-supply-v2", 5000000);
    const [reserves, setReserves] = useSharedState<{ id: string; name: string; amount: number; type: "fiat" | "crypto" | "tbill" }[]>("pob-reserves-v2", [
        { id: "1", name: "Treasury T-Bills", amount: 2000000, type: "tbill" },
        { id: "2", name: "Cold Wallet BTC", amount: 3000000, type: "crypto" },
        { id: "3", name: "Vault Cash", amount: 500000, type: "fiat" },
    ]);

    // Processing State
    const [isLoading, setIsLoading] = useState(false);
    const [isAnchoring, setIsAnchoring] = useState(false);
    const [datahavenCID, setDatahavenCID] = useState<string | null>(null);
    const [zkProof, setZkProof] = useState<string | null>(null);
    const [anchoredTx, setAnchoredTx] = useState<string | null>(null);

    // Globally synced proof history
    const [proofHistory, setProofHistory] = useSharedState<any[]>("pob-history", []);

    // Sidebar Oracle State
    const [tradeAmount, setTradeAmount] = useState<number>(100000);

    // Derived Financials
    const totalReserves = reserves.reduce((acc, r) => acc + r.amount, 0);
    const isBacked = totalReserves >= circulatingSupply;
    const collateralizationRatio = circulatingSupply > 0 ? ((totalReserves / circulatingSupply) * 100).toFixed(0) : "0";
    const surplus = totalReserves - circulatingSupply;

    // ─── Editable Asset Handlers ───────────────────────────────────────────────
    const handleAssetChange = useCallback(
        (id: string, field: "name" | "amount" | "type", value: string | number) => {
            setReserves((prev) =>
                prev.map((r) => (r.id === id ? { ...r, [field]: field === "amount" ? Math.max(0, Number(value)) : value } : r))
            );
        },
        [setReserves]
    );

    const handleAddAsset = () => {
        const newRow = {
            id: Date.now().toString(),
            name: "New Asset",
            amount: 0,
            type: "fiat" as const,
        };
        setReserves((prev) => [...prev, newRow]);
    };

    const handleRemoveAsset = (id: string) => {
        setReserves((prev) => prev.filter((r) => r.id !== id));
    };

    // ─── Proof Handlers ────────────────────────────────────────────────────────
    const handleSealAndProve = async () => {
        if (!privateKey.trim()) {
            alert("SECURITY HALT: Please enter your DataHaven private key.");
            return;
        }
        if (!isBacked) {
            alert(
                `INSOLVENCY SHUTDOWN: Total Reserves ($${(totalReserves / 1e6).toFixed(1)}M) must be >= Declared Liabilities ($${(circulatingSupply / 1e6).toFixed(1)}M).`
            );
            return;
        }

        setIsLoading(true);
        setDatahavenCID(null);
        setZkProof(null);
        setAnchoredTx(null);

        const payload = { timestamp: Date.now(), circulatingSupply, reservesBreakdown: reserves };

        try {
            const dhResult = await encryptAndUploadToDataHaven(payload, privateKey);
            setDatahavenCID(dhResult.cid);

            const amounts = reserves.map((r) => r.amount);
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
                if (anchorErr?.message?.includes("No Web3 wallet injected")) {
                    alert("On-Chain Anchor Skipped: No Web3 Wallet detected. Open localhost in your main Chrome window with MetaMask.");
                } else {
                    alert(`On-Chain Anchor failed: ${anchorErr?.message || "Unknown error"}. Proof was still saved locally.`);
                }
            }
            setIsAnchoring(false);

            setProofHistory((prev) => [
                {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    cid: dhResult.cid,
                    proof: proofStr,
                    coverage: collateralizationRatio,
                    assets: totalReserves,
                    status: isBacked ? "Valid" : "Review",
                    institution: "ZeroVault Demo",
                    txHash: currentTxHash,
                },
                ...prev,
            ]);
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
            setProofHistory((prev) => {
                if (prev.length === 0) return prev;
                const newHistory = [...prev];
                newHistory[0] = { ...newHistory[0], txHash: hash };
                return newHistory;
            });
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Error anchoring to blockchain. Ensure your wallet is connected to Sepolia.");
        }
        setIsAnchoring(false);
    };

    const handleBuyProtocolToken = () => setCirculatingSupply((prev) => prev + tradeAmount);
    const handleSellProtocolToken = () => setCirculatingSupply((prev) => Math.max(1000, prev - tradeAmount));
    const handleBtcPriceChange = (percentage: number) => {
        setReserves((prevReserves) =>
            prevReserves.map((r) => {
                if (r.type === "crypto") {
                    const change = r.amount * percentage;
                    return { ...r, amount: Math.max(0, Math.floor(r.amount + change)) };
                }
                return r;
            })
        );
    };

    return (
        <main className="app-content">
            <div className="sec-hdr" style={{ marginBottom: "40px" }}>
                <div>
                    <div className="sec-num">// ISSUER NODE</div>
                    <div className="sec-title">Generate <span className="hl">Proof</span></div>
                </div>
                <div className="sec-meta">
                    <button className="btn-primary" onClick={handleSealAndProve} disabled={isLoading} style={{ fontSize: "10px", padding: "10px 20px" }}>
                        {isLoading ? "● PROCESSING..." : "→ RUN ENGINE"}
                    </button>
                </div>
            </div>

            {/* ── LIVE STATS BAR ─────────────────────────────────────────────── */}
            <div className="stats-bar" style={{ marginBottom: "40px", background: "var(--bg1)", gridTemplateColumns: "repeat(5, 1fr)" }}>
                <StatCell
                    label="Total Liabilities"
                    value={(circulatingSupply / 1e6).toFixed(2)}
                    unit="M"
                    sublabel="Declared obligations"
                    sublabelClass="dn"
                    valueStyle={{ color: "var(--red)" }}
                />
                <StatCell
                    label="Reserve Assets"
                    value={(totalReserves / 1e6).toFixed(2)}
                    unit="M"
                    sublabel={`${reserves.length} wallets declared`}
                    sublabelClass="up"
                />
                <StatCell
                    label="Coverage Ratio"
                    value={collateralizationRatio}
                    unit="%"
                    sublabel={isBacked ? "● Above threshold" : "● Insolvent!"}
                    sublabelClass={isBacked ? "up" : "dn"}
                    valueStyle={{ color: isBacked ? "var(--green)" : "var(--red)" }}
                />
                <StatCell
                    label="Surplus / Deficit"
                    value={`${surplus >= 0 ? "+" : ""}${(surplus / 1e6).toFixed(2)}`}
                    unit="M"
                    sublabel={surplus >= 0 ? "● Solvent" : "● Under-collateralized"}
                    sublabelClass={surplus >= 0 ? "up" : "dn"}
                    valueStyle={{ color: surplus >= 0 ? "var(--green)" : "var(--red)", fontSize: "28px" }}
                />
                <div className="stat-cell vis">
                    <div className="sl">Proof Status</div>
                    <div className="sv" style={{ fontSize: "22px", paddingTop: "10px" }}>{isLoading ? "PROCESSING" : "READY"}</div>
                </div>
            </div>

            <div className="live-grid">
                <div className="main-col" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* ── LIABILITY DECLARATION ────────────────────────────────── */}
                    <div className="panel">
                        <div className="panel-header" style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Liability Declaration</span>
                            <span style={{ color: "var(--green)" }}>● public_input</span>
                        </div>
                        <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div>
                                <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "8px", letterSpacing: "0.1em" }}>TOTAL LIABILITIES ($POC)</div>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={circulatingSupply}
                                    onChange={(e) => setCirculatingSupply(Math.max(0, Number(e.target.value)))}
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "8px", letterSpacing: "0.1em" }}>PRIVATE KEY (DataHaven)</div>
                                <input
                                    className="form-input"
                                    type="password"
                                    placeholder="0x…"
                                    value={privateKey}
                                    onChange={(e) => setPrivateKey(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── RESERVE ASSETS (EDITABLE) ────────────────────────────── */}
                    <div className="panel">
                        <div className="panel-header" style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Reserve Assets</span>
                            <span style={{ color: "var(--green)" }}>● private_input (AES-256)</span>
                        </div>

                        {/* Table header */}
                        <div className="tbl-head" style={{ gridTemplateColumns: "2.5fr 1fr 1.5fr 1fr 40px", borderTop: "1px solid var(--border2)" }}>
                            <span>ASSET / WALLET</span>
                            <span>TYPE</span>
                            <span>BALANCE (USD)</span>
                            <span>ENCRYPTION</span>
                            <span></span>
                        </div>

                        {/* Editable rows */}
                        {reserves.map((r) => (
                            <div
                                className="tbl-row"
                                key={r.id}
                                style={{
                                    gridTemplateColumns: "2.5fr 1fr 1.5fr 1fr 40px",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "10px 20px",
                                }}
                            >
                                {/* Name */}
                                <input
                                    value={r.name}
                                    onChange={(e) => handleAssetChange(r.id, "name", e.target.value)}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        borderBottom: "1px solid var(--border2)",
                                        color: "var(--text)",
                                        fontFamily: "inherit",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        width: "100%",
                                        outline: "none",
                                        padding: "4px 0",
                                        cursor: "text",
                                    }}
                                    onFocus={(e) => (e.target.style.borderBottomColor = "var(--green)")}
                                    onBlur={(e) => (e.target.style.borderBottomColor = "var(--border2)")}
                                />

                                {/* Type dropdown */}
                                <select
                                    value={r.type}
                                    onChange={(e) => handleAssetChange(r.id, "type", e.target.value)}
                                    style={{
                                        background: "var(--bg2)",
                                        border: "1px solid var(--border2)",
                                        color: "var(--muted)",
                                        fontFamily: "inherit",
                                        fontSize: "9px",
                                        letterSpacing: "0.1em",
                                        padding: "4px 8px",
                                        cursor: "pointer",
                                        outline: "none",
                                        width: "100%",
                                    }}
                                >
                                    <option value="fiat">FIAT</option>
                                    <option value="crypto">CRYPTO</option>
                                    <option value="tbill">TBILL</option>
                                </select>

                                {/* Amount */}
                                <input
                                    type="number"
                                    min={0}
                                    value={r.amount}
                                    onChange={(e) => handleAssetChange(r.id, "amount", e.target.value)}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        borderBottom: "1px solid var(--border2)",
                                        color: "var(--green)",
                                        fontFamily: "inherit",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        width: "100%",
                                        outline: "none",
                                        padding: "4px 0",
                                        cursor: "text",
                                        textAlign: "right",
                                    }}
                                    onFocus={(e) => (e.target.style.borderBottomColor = "var(--green)")}
                                    onBlur={(e) => (e.target.style.borderBottomColor = "var(--border2)")}
                                />

                                {/* Encryption badge */}
                                <div className="rs ok" style={{ fontSize: "9px" }}>AES-256</div>

                                {/* Remove button */}
                                <button
                                    onClick={() => handleRemoveAsset(r.id)}
                                    title="Remove asset"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "var(--red)",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        padding: "4px",
                                        lineHeight: 1,
                                        opacity: 0.7,
                                        transition: "opacity 0.15s",
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
                                    onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {/* Add Asset */}
                        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border2)" }}>
                            <button
                                onClick={handleAddAsset}
                                className="btn-secondary"
                                style={{ fontSize: "9px", padding: "8px 18px", letterSpacing: "0.12em" }}
                            >
                                + ADD ASSET
                            </button>
                            {reserves.length === 0 && (
                                <span style={{ fontSize: "10px", color: "var(--muted)", marginLeft: "16px" }}>No assets declared</span>
                            )}
                        </div>
                    </div>

                    {/* ── PIPELINE STATUS ───────────────────────────────────────── */}
                    <div className="panel" style={{ marginBottom: "40px" }}>
                        <div className="panel-header">Pipeline Status</div>
                        <div className="panel-body">
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ fontSize: "11px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border2)", paddingBottom: "12px" }}>
                                    <span style={{ color: datahavenCID ? "var(--green)" : "var(--muted)" }}>1. DataHaven Upload</span>
                                    <span>{datahavenCID ? "✓ Complete" : isLoading ? "● Processing" : "○ Waiting"}</span>
                                </div>
                                <div style={{ fontSize: "11px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border2)", paddingBottom: "12px" }}>
                                    <span style={{ color: zkProof ? "var(--green)" : "var(--muted)" }}>2. Noir ZK Circuit Proving</span>
                                    <span>{zkProof ? "✓ Complete" : isLoading && datahavenCID ? "● Proving" : "○ Waiting"}</span>
                                </div>
                                <div style={{ fontSize: "11px", display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: anchoredTx ? "var(--green)" : "var(--muted)" }}>3. EVM On-Chain Anchor</span>
                                    <span>{anchoredTx ? "✓ Complete" : isAnchoring ? "● Anchoring" : "○ Waiting"}</span>
                                </div>
                            </div>

                            {datahavenCID && (
                                <div className="proof-panel" style={{ marginTop: "24px", gridTemplateColumns: "1fr" }}>
                                    <div className="code-hdr"><span>ARTIFACTS</span><span style={{ color: "var(--green)" }}>● 3 objects</span></div>
                                    <div className="code-body" style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
                                        <div className="code-line"><span className="kw">CID:</span> <span className="tc">{datahavenCID}</span></div>
                                        {zkProof && <div className="code-line" style={{ marginTop: "10px" }}><span className="kw">PROOF:</span> <span className="tc">{zkProof.substring(0, 60)}...</span></div>}
                                        {anchoredTx && <div className="code-line" style={{ marginTop: "10px" }}><span className="kw">TX:</span> <span className="tc">{anchoredTx}</span></div>}
                                    </div>
                                </div>
                            )}

                            {zkProof && !anchoredTx && !isAnchoring && (
                                <button className="btn-secondary" onClick={handleAnchorOnChain} style={{ width: "100%", marginTop: "20px", justifyContent: "center" }}>
                                    Confirm On-Chain Anchor
                                </button>
                            )}
                        </div>
                    </div>

                </div>

                {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
                <div className="sidebar">
                    <div className="s-card">
                        <div className="s-lbl">Oracle Feed <span>LIVE</span></div>
                        <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "20px", marginBottom: "8px", letterSpacing: "0.1em" }}>TRADE VOLUME ($POC)</div>
                        <input className="form-input" type="number" value={tradeAmount} onChange={(e) => setTradeAmount(Number(e.target.value))} style={{ marginBottom: "16px" }} />
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
                </div>

            </div>
        </main>
    );
}
