"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSharedState } from "@/hooks/useSharedState";

export function Sidebar() {
    const pathname = usePathname();
    const [proofHistory] = useSharedState<any[]>("pob-history", []);

    return (
        <div className="rail">
            <div className="rail-logo">
                <div className="logo-mark relative overflow-hidden bg-transparent">
                    <img src="/logo.png" alt="ZeroVault" className="w-full h-full object-contain" />
                </div>
                <div className="logo-name">ZeroVault</div>
            </div>
            <div className="rail-nav">
                <div className="nav-group">
                    <span className="ngl">Platform</span>
                    <Link href="/" className={`ni ${pathname === "/" ? "active" : ""}`}>
                        <span>⬡</span> Overview
                    </Link>
                    <Link href="/issuer" className={`ni ${pathname === "/issuer" ? "active" : ""}`}>
                        <span>⚡</span> Issue Proof
                    </Link>
                    <Link href="/auditor" className={`ni ${pathname === "/auditor" ? "active" : ""}`}>
                        <span>⚖️</span> Public Auditor
                    </Link>
                </div>
                <div className="nav-group">
                    <span className="ngl">Organization</span>
                    <Link href="/history" className={`ni ${pathname === "/history" ? "active" : ""}`}>
                        <span>📋</span> Proof History <span className="ni-count">{proofHistory.length}</span>
                    </Link>
                    <div className="ni">
                        <span>🗄️</span> DataHaven <span className="ni-count">{proofHistory.length}</span>
                    </div>
                    <div className="ni">
                        <span>🔔</span> Alerts
                    </div>
                </div>
                <div className="nav-group">
                    <span className="ngl">Settings</span>
                    <div className="ni">
                        <span>🔑</span> API Keys
                    </div>
                    <div className="ni">
                        <span>🏢</span> Organization
                    </div>
                </div>
            </div>
            <div className="rail-footer">
                <div className="sys-pill">
                    <div className="sys-dot"></div>
                    <div className="sys-text">
                        Network <strong>Live</strong> · 3 proofs/hr
                    </div>
                </div>
            </div>
        </div>
    );
}
