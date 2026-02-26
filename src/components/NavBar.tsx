"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";

function truncateAddress(addr: string) {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function NavBar() {
    const { address, isConnected, isConnecting, connect, disconnect } = useWallet();

    return (
        <nav>
            <Link href="/" className="logo">
                <div className="logo-box"></div>
                <span className="logo-text">ZERO<span>PROOF</span></span>
            </Link>
            <div className="nav-center">
                <Link href="/" className="nav-link">Overview</Link>
                <Link href="/issuer" className="nav-link">Issuer</Link>
                <Link href="/auditor" className="nav-link">Auditor</Link>
            </div>
            <div className="nav-right">
                {isConnected && address ? (
                    <button
                        className="nav-btn"
                        onClick={disconnect}
                        title="Click to disconnect"
                        style={{ color: "var(--green)", borderColor: "var(--green)", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block", flexShrink: 0 }} />
                        {truncateAddress(address)}
                    </button>
                ) : (
                    <button
                        className="nav-btn"
                        onClick={connect}
                        disabled={isConnecting}
                        style={{ minWidth: 140 }}
                    >
                        {isConnecting ? "CONNECTING…" : "CONNECT WALLET"}
                    </button>
                )}
                <Link href="/history" className="nav-btn">Proof History</Link>
            </div>
        </nav>
    );
}
