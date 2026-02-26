"use client";

import { useState } from "react";
import { encryptAndUploadToDataHaven } from "@/utils/datahaven";
import { generateNoirProof } from "@/utils/noir";
import { useSharedState } from "@/hooks/useSharedState";

export default function IssuerPage() {
    // Developer Wallet State
    const [privateKey, setPrivateKey] = useState<string>("");

    // Globally sync across tabs via localStorage custom hook
    const [circulatingSupply, setCirculatingSupply] = useSharedState<number>("pob-supply-v2", 5000000);
    const [reserves, setReserves] = useSharedState<{ id: string; name: string; amount: number; type: 'fiat' | 'crypto' | 'tbill' }[]>("pob-reserves-v2", [
        { id: "1", name: "Treasury T-Bills", amount: 2000000, type: 'tbill' },
        { id: "2", name: "Cold Wallet BTC", amount: 3000000, type: 'crypto' },
        { id: "3", name: "Vault Cash", amount: 500000, type: 'fiat' },
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
    const collateralizationRatio = ((totalReserves / circulatingSupply) * 100).toFixed(0);

    const handleSealAndProve = async () => {
        if (!privateKey.trim()) {
            alert("SECURITY HALT: Please enter your private key to sign the DataHaven upload.");
            return;
        }

        if (!isBacked) {
            alert(`INSOLVENCY SHUTDOWN: Total Reserves ($${(totalReserves / 1e6).toFixed(1)}M) must be greater than or equal to Declared Liabilities ($${(circulatingSupply / 1e6).toFixed(1)}M). The Zero-Knowledge circuit mathematically rejects under-collateralized proofs.`);
            return;
        }

        setIsLoading(true);
        setDatahavenCID(null);
        setZkProof(null);
        setAnchoredTx(null);

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

            // Automate the On-Chain Anchoring step
            let currentTxHash: string | null = null;
            setIsAnchoring(true);
            try {
                const { anchorProofOnChain } = await import('@/utils/anchoring');
                currentTxHash = await anchorProofOnChain(dhResult.cid, proofStr);
                setAnchoredTx(currentTxHash);
            } catch (anchorErr: any) {
                console.warn("Auto-anchoring failed or was cancelled by user:", anchorErr);
                if (anchorErr?.message?.includes("No Web3 wallet injected")) {
                    alert("On-Chain Anchor Skipped: No Web3 Wallet (like MetaMask) was detected in this specific browser window. If you are using an IDE Preview or Incognito, please open localhost:3000 in your main Chrome window.");
                } else {
                    alert(`On-Chain Anchor failed: ${anchorErr?.message || "Unknown error"}. The proof was still saved locally.`);
                }
            }
            setIsAnchoring(false);

            setProofHistory(prev => [{
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                cid: dhResult.cid,
                proof: proofStr,
                coverage: collateralizationRatio,
                assets: totalReserves,
                status: isBacked ? "Valid" : "Review",
                institution: "ZeroVault Demo",
                txHash: currentTxHash
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
            const { anchorProofOnChain } = await import('@/utils/anchoring');
            const hash = await anchorProofOnChain(datahavenCID, zkProof);
            setAnchoredTx(hash);
            setProofHistory(prev => {
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
        setReserves(prevReserves => prevReserves.map(r => {
            if (r.type === "crypto") {
                const change = r.amount * percentage;
                return { ...r, amount: Math.max(0, Math.floor(r.amount + change)) };
            }
            return r;
        }));
    };

    return (
        <main className="app-content">
            <div className="sec-hdr" style={{ marginBottom: '40px' }}>
                <div>
                    <div className="sec-num">// ISSUER NODE</div>
                    <div className="sec-title">Generate <span className="hl">Proof</span></div>
                </div>
                <div className="sec-meta">
                    <button className="btn-primary" onClick={handleSealAndProve} disabled={isLoading} style={{ fontSize: '10px', padding: '10px 20px' }}>
                        {isLoading ? "● PROCESSING..." : "→ RUN ENGINE"}
                    </button>
                </div>
            </div>

            <div className="stats-bar" style={{ marginBottom: '40px', background: 'var(--bg1)' }}>
                <div className="stat-cell vis">
                    <div className="sl">Total Liabilities</div>
                    <div className="sv" style={{ color: 'var(--red)' }}>{(circulatingSupply / 1e6).toFixed(1)}<span className="u">M</span></div>
                    <div className="sc dn">Declared obligations</div>
                </div>
                <div className="stat-cell vis">
                    <div className="sl">Reserve Assets</div>
                    <div className="sv">{(totalReserves / 1e6).toFixed(1)}<span className="u">M</span></div>
                    <div className="sc up">{reserves.length} wallets declared</div>
                </div>
                <div className="stat-cell vis">
                    <div className="sl">Coverage Ratio</div>
                    <div className="sv" style={{ color: isBacked ? 'var(--green)' : 'var(--red)' }}>{collateralizationRatio}<span className="u">%</span></div>
                    <div className={`sc ${isBacked ? 'up' : 'dn'}`}>{isBacked ? '● Above threshold' : '● Insolvent!'}</div>
                </div>
                <div className="stat-cell vis">
                    <div className="sl">Proof Status</div>
                    <div className="sv" style={{ fontSize: '24px', paddingTop: '10px' }}>{isLoading ? 'PROCESSING' : 'READY'}</div>
                </div>
            </div>

            <div className="live-grid">
                <div className="main-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div className="panel">
                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Liability Declaration</span>
                            <span style={{ color: 'var(--green)' }}>● public_input</span>
                        </div>
                        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.1em' }}>TOTAL LIABILITIES ($POC)</div>
                                <input className="form-input" value={circulatingSupply} readOnly />
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.1em' }}>PRIVATE KEY</div>
                                <input className="form-input" type="password" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Reserve Assets</span>
                            <span style={{ color: 'var(--green)' }}>● private_input (AES-256)</span>
                        </div>
                        <div className="proof-table" style={{ border: 'none', borderTop: '1px solid var(--border2)' }}>
                            <div className="tbl-head" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                                <span>ASSET / WALLET</span><span>TYPE</span><span>BALANCE (USD)</span><span>ENCRYPTION</span>
                            </div>
                            {reserves.map(r => (
                                <div className="tbl-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }} key={r.id}>
                                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                                    <div className="rs ok" style={{ color: 'var(--muted)' }}>{r.type.toUpperCase()}</div>
                                    <div className="rval" style={{ textAlign: 'left', color: 'var(--green)' }}>${r.amount.toLocaleString()}</div>
                                    <div className="rs ok">AES-256</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="panel" style={{ marginBottom: '40px' }}>
                        <div className="panel-header">Pipeline Status</div>
                        <div className="panel-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border2)', paddingBottom: '12px' }}>
                                    <span style={{ color: datahavenCID ? 'var(--green)' : 'var(--muted)' }}>1. DataHaven Upload</span>
                                    <span>{datahavenCID ? '✓ Complete' : isLoading ? '● Processing' : '○ Waiting'}</span>
                                </div>
                                <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border2)', paddingBottom: '12px' }}>
                                    <span style={{ color: zkProof ? 'var(--green)' : 'var(--muted)' }}>2. Noir ZK Circuit Proving</span>
                                    <span>{zkProof ? '✓ Complete' : (isLoading && datahavenCID) ? '● Proving' : '○ Waiting'}</span>
                                </div>
                                <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: anchoredTx ? 'var(--green)' : 'var(--muted)' }}>3. EVM On-Chain Anchor</span>
                                    <span>{anchoredTx ? '✓ Complete' : isAnchoring ? '● Anchoring' : '○ Waiting'}</span>
                                </div>
                            </div>

                            {datahavenCID && (
                                <div className="proof-panel" style={{ marginTop: '24px', gridTemplateColumns: '1fr' }}>
                                    <div className="code-hdr"><span>ARTIFACTS</span><span style={{ color: 'var(--green)' }}>● 3 objects</span></div>
                                    <div className="code-body" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                        <div className="code-line"><span className="kw">CID:</span> <span className="tc">{datahavenCID}</span></div>
                                        {zkProof && <div className="code-line" style={{ marginTop: '10px' }}><span className="kw">PROOF:</span> <span className="tc">{zkProof.substring(0, 60)}...</span></div>}
                                        {anchoredTx && <div className="code-line" style={{ marginTop: '10px' }}><span className="kw">TX:</span> <span className="tc">{anchoredTx}</span></div>}
                                    </div>
                                </div>
                            )}

                            {zkProof && !anchoredTx && !isAnchoring && (
                                <button className="btn-secondary" onClick={handleAnchorOnChain} style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}>
                                    Confirm On-Chain Anchor
                                </button>
                            )}
                        </div>
                    </div>

                </div>

                <div className="sidebar">
                    <div className="s-card">
                        <div className="s-lbl">Oracle Feed <span>LIVE</span></div>
                        <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '20px', marginBottom: '8px', letterSpacing: '0.1em' }}>TRADE VOLUME ($POC)</div>
                        <input className="form-input" type="number" value={tradeAmount} onChange={(e) => setTradeAmount(Number(e.target.value))} style={{ marginBottom: '16px' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button className="nav-btn" onClick={handleBuyProtocolToken} style={{ color: 'var(--green)', borderColor: 'var(--green)', width: '100%', textAlign: 'center' }}>BUY</button>
                            <button className="nav-btn" onClick={handleSellProtocolToken} style={{ color: 'var(--red)', borderColor: 'var(--red)', width: '100%', textAlign: 'center' }}>SELL</button>
                        </div>
                    </div>
                    <div className="s-card">
                        <div className="s-lbl" style={{ marginBottom: '20px' }}>External Shocks <span style={{ color: 'var(--muted)' }}>TEST</span></div>
                        <button className="nav-btn" onClick={() => handleBtcPriceChange(0.05)} style={{ width: '100%', marginBottom: '10px', textAlign: 'left' }}>
                            BULL MARKET <span style={{ float: 'right', color: 'var(--green)' }}>+5%</span>
                        </button>
                        <button className="nav-btn" onClick={() => handleBtcPriceChange(-0.15)} style={{ width: '100%', textAlign: 'left', borderColor: 'var(--red)', color: 'var(--red)' }}>
                            FLASH CRASH <span style={{ float: 'right' }}>-15%</span>
                        </button>
                    </div>
                </div>

            </div>
        </main>
    );
}
