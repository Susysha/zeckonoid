"use client";

import { useState } from "react";
import { encryptAndUploadToDataHaven } from "@/utils/datahaven";
import { generateNoirProof } from "@/utils/noir";
import {
    ShieldCheck, Database, FileKey, Copy, CheckCircle2,
    Activity, Landmark, Bitcoin, Banknote, ArrowRightLeft, TrendingUp, TrendingDown, Lock
} from "lucide-react";

export default function IssuerDashboard() {
    // Developer Wallet State
    const [privateKey, setPrivateKey] = useState<string>("0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133");

    // Core Financial State
    const [circulatingSupply, setCirculatingSupply] = useState<number>(5000000);
    const [reserves, setReserves] = useState<{ id: string; name: string; amount: number; type: 'fiat' | 'crypto' | 'tbill' }[]>([
        { id: "1", name: "Treasury T-Bills", amount: 2000000, type: 'tbill' },
        { id: "2", name: "Cold Wallet BTC", amount: 3000000, type: 'crypto' },
        { id: "3", name: "Vault Cash", amount: 500000, type: 'fiat' },
    ]);

    // Processing State
    const [isLoading, setIsLoading] = useState(false);
    const [datahavenCID, setDatahavenCID] = useState<string | null>(null);
    const [zkProof, setZkProof] = useState<string | null>(null);
    const [copiedData, setCopiedData] = useState<string | null>(null);

    // Sidebar Oracle State
    const [tradeAmount, setTradeAmount] = useState<number>(100000);

    // Derived Financials
    const totalReserves = reserves.reduce((acc, r) => acc + r.amount, 0);
    const isBacked = totalReserves >= circulatingSupply;
    const collateralizationRatio = ((totalReserves / circulatingSupply) * 100).toFixed(2);
    const isDangerWarning = isBacked && (totalReserves / circulatingSupply) < 1.05;

    // ---- HANDLERS ----
    const handleUpdateReserve = (id: string, amount: number) => {
        setReserves(reserves.map((r) => (r.id === id ? { ...r, amount } : r)));
    };

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
            alert("Error generating proof or uploading to DataHaven. Check console for Testnet balance or script errors.");
        }
        setIsLoading(false);
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopiedData(type);
        setTimeout(() => setCopiedData(null), 2000);
    };

    // ---- ORACLE HANDLERS ----
    const handleBuyProtocolToken = () => {
        setCirculatingSupply((prev) => prev + tradeAmount);
    };

    const handleSellProtocolToken = () => {
        setCirculatingSupply((prev) => Math.max(1000, prev - tradeAmount));
    };

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
        <div className="flex flex-col lg:flex-row gap-8 min-h-[85vh]">

            {/* LEFT COLUMN: ISSUER OPERATIONS (70%) */}
            <div className="lg:w-[70%] flex flex-col space-y-8">

                {/* Header Profile Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dev Wallet Card (ENS/UPI Style) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 border-4 border-slate-50 shadow-sm flex items-center justify-center text-white font-bold text-xl tracking-tight">
                                    al
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">alith.datahaven.eth</h3>
                                    <p className="text-sm text-slate-500 font-mono mt-1">0x5fb9...2133</p>
                                </div>
                            </div>
                            <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center tracking-wide border border-emerald-100 uppercase">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                                Connected
                            </div>
                        </div>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="password"
                                value={privateKey}
                                onChange={(e) => setPrivateKey(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-shadow"
                                placeholder="Private Key"
                            />
                        </div>
                    </div>

                    {/* Protocol Status Card */}
                    <div className={`border rounded-2xl p-6 shadow-sm flex flex-col justify-center transition-colors duration-500 ${!isBacked ? 'bg-red-50 border-red-200' :
                        isDangerWarning ? 'bg-amber-50 border-amber-200' :
                            'bg-indigo-50 border-indigo-200'
                        }`}>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Protocol Status</span>
                            <span className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${!isBacked ? 'bg-red-200 text-red-800' :
                                isDangerWarning ? 'bg-amber-200 text-amber-800' :
                                    'bg-indigo-200 text-indigo-800'
                                }`}>
                                {!isBacked ? 'Insolvent' : isDangerWarning ? 'Warning' : 'Healthy'}
                            </span>
                        </div>
                        <div className="flex items-end space-x-2">
                            <span className={`text-5xl font-extrabold tabular-nums tracking-tighter ${!isBacked ? 'text-red-700' : isDangerWarning ? 'text-amber-700' : 'text-indigo-700'
                                }`}>
                                {collateralizationRatio}%
                            </span>
                            <span className="text-base font-bold text-slate-600 mb-1.5">Backed</span>
                        </div>
                    </div>
                </div>

                {/* Reserves & Liabilities Core */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/80">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Balance Sheet</h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10 flex-1">
                        {/* Liabilities */}
                        <div className="space-y-5">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center">
                                <Database className="w-4 h-4 mr-2" />
                                Public Liabilities
                            </h3>
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                <label className="block text-sm font-bold text-slate-600 mb-2">Total Circulating Supply ($POC)</label>
                                <input
                                    type="number"
                                    value={circulatingSupply}
                                    onChange={(e) => setCirculatingSupply(Number(e.target.value))}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-slate-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                />
                            </div>
                        </div>

                        {/* Assets */}
                        <div className="space-y-5">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center">
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Private Reserve Assets
                            </h3>

                            <div className="space-y-4">
                                {reserves.map(reserve => (
                                    <div key={reserve.id} className="flex items-center bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all group">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors ${reserve.type === 'tbill' ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 group-hover:text-emerald-700' :
                                            reserve.type === 'crypto' ? 'bg-orange-100 text-orange-600 group-hover:bg-orange-200 group-hover:text-orange-700' :
                                                'bg-blue-100 text-blue-600 group-hover:bg-blue-200 group-hover:text-blue-700'
                                            }`}>
                                            {reserve.type === 'tbill' && <Landmark className="w-6 h-6" />}
                                            {reserve.type === 'crypto' && <Bitcoin className="w-6 h-6" />}
                                            {reserve.type === 'fiat' && <Banknote className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{reserve.name}</label>
                                            <input
                                                type="number"
                                                value={reserve.amount}
                                                onChange={(e) => handleUpdateReserve(reserve.id, Number(e.target.value))}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 font-bold text-lg focus:ring-0"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proof Generation Action */}
                <div className="pt-2">
                    <button
                        onClick={handleSealAndProve}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-5 rounded-2xl shadow-xl transition-all active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:active:scale-100"
                    >
                        {isLoading ? (
                            <div className="flex items-center">
                                <div className="w-6 h-6 border-4 border-slate-500/30 border-t-slate-500 rounded-full animate-spin mr-3"></div>
                                Processing ZK Cryptography...
                            </div>
                        ) : (
                            <>
                                <FileKey className="w-6 h-6 mr-3 text-blue-400" />
                                Seal to DataHaven & Generate ZK Proof
                            </>
                        )}
                    </button>
                </div>

                {/* Artifacts Output */}
                {(datahavenCID || zkProof) && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 mt-2">
                        <div className="p-5 border-b border-slate-100 bg-emerald-50/50 flex items-center">
                            <CheckCircle2 className="w-6 h-6 mr-3 text-emerald-600" />
                            <h3 className="text-base font-bold text-emerald-900 tracking-tight">Cryptographic Artifacts Generated</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">DataHaven CID</span>
                                    <button onClick={() => copyToClipboard(datahavenCID!, 'cid')} className="text-slate-400 hover:text-blue-600 transition-colors">
                                        {copiedData === 'cid' ? <span className="text-xs text-emerald-600 font-bold">Copied!</span> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-sm text-slate-700 truncate shadow-inner">
                                    {datahavenCID}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Noir ZK Proof</span>
                                    <button onClick={() => copyToClipboard(zkProof!, 'proof')} className="text-slate-400 hover:text-blue-600 transition-colors">
                                        {copiedData === 'proof' ? <span className="text-xs text-emerald-600 font-bold">Copied!</span> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-sm text-slate-700 truncate shadow-inner">
                                    {zkProof}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* RIGHT COLUMN: SIDEBAR ORACLE (30%) */}
            <div className="lg:w-[30%] bg-[#0B1120] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 border border-slate-800 relative z-10">
                <div className="p-6 border-b border-slate-800 bg-[#0F172A] flex flex-col">
                    <h2 className="text-lg font-bold flex items-center text-white mb-2 tracking-tight">
                        <Activity className="w-5 h-5 mr-2 text-blue-400" />
                        Live Market Oracle
                    </h2>
                    <p className="text-sm text-slate-400 leading-relaxed">External events execute here and instantly impact the protocol's live balance sheet.</p>
                </div>

                <div className="p-6 space-y-10 overflow-y-auto flex-1">

                    {/* Trade POC Card */}
                    <div className="space-y-5">
                        <div className="flex flex-col mb-4">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center">
                                <ArrowRightLeft className="w-4 h-4 mr-2 text-indigo-400" />
                                Retail Trading Exchange
                            </h3>
                            <div className="h-px bg-gradient-to-r from-slate-700 to-transparent mt-3 w-full"></div>
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 focus-within:border-blue-500/50 transition-colors">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trade Amount ($POC)</label>
                            <input
                                type="number"
                                value={tradeAmount}
                                onChange={(e) => setTradeAmount(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleBuyProtocolToken}
                                className="flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-900/20 font-bold text-sm py-3.5 rounded-xl transition-all active:scale-95"
                            >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                BUY
                            </button>
                            <button
                                onClick={handleSellProtocolToken}
                                className="flex items-center justify-center bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-900/20 font-bold text-sm py-3.5 rounded-xl transition-all active:scale-95"
                            >
                                <TrendingDown className="w-4 h-4 mr-2" />
                                SELL
                            </button>
                        </div>
                    </div>

                    {/* BTC Oracle Card */}
                    <div className="space-y-5 pt-2">
                        <div className="flex flex-col mb-4">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center">
                                <Bitcoin className="w-4 h-4 mr-2 text-orange-400" />
                                Cryptocurrency Action
                            </h3>
                            <div className="h-px bg-gradient-to-r from-slate-700 to-transparent mt-3 w-full"></div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => handleBtcPriceChange(0.05)}
                                className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl transition-all group shadow-sm hover:shadow-md"
                            >
                                <div className="flex flex-col text-left">
                                    <span className="text-base font-bold text-white tracking-tight leading-tight">Bull Market</span>
                                    <span className="text-xs font-medium text-slate-400 mt-1">BTC value jumps +5%</span>
                                </div>
                                <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider group-hover:scale-110 transition-transform bg-emerald-400/10 px-2.5 py-1.5 rounded-lg border border-emerald-400/20">
                                    + Value
                                </div>
                            </button>

                            <button
                                onClick={() => handleBtcPriceChange(-0.15)}
                                className="w-full flex items-center justify-between bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-500/30 p-4 rounded-2xl transition-all group shadow-sm hover:shadow-md"
                            >
                                <div className="flex flex-col text-left">
                                    <span className="text-base font-bold text-white tracking-tight leading-tight">Flash Crash</span>
                                    <span className="text-xs font-medium text-slate-400 mt-1">BTC value drops -15%</span>
                                </div>
                                <div className="text-red-400 font-bold text-xs uppercase tracking-wider group-hover:scale-110 transition-transform bg-red-400/10 px-2.5 py-1.5 rounded-lg border border-red-400/20">
                                    - Value
                                </div>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

