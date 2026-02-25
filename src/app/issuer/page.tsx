"use client";

import { useState } from "react";
import { encryptAndUploadToDataHaven } from "@/utils/datahaven";
import { generateNoirProof } from "@/utils/noir";
import { ShieldAlert, ShieldCheck, Database, FileKey, Copy, CheckCircle2 } from "lucide-react";

export default function IssuerDashboard() {
    const [privateKey, setPrivateKey] = useState<string>("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    const [circulatingSupply, setCirculatingSupply] = useState<number>(5000000);
    const [reserves, setReserves] = useState<{ id: string; name: string; amount: number }[]>([
        { id: "1", name: "Treasury T-Bills", amount: 2000000 },
        { id: "2", name: "Cold Wallet BTC", amount: 3000000 },
        { id: "3", name: "Vault Cash", amount: 500000 },
    ]);

    const [isLoading, setIsLoading] = useState(false);
    const [simulateUpload, setSimulateUpload] = useState(true);
    const [datahavenCID, setDatahavenCID] = useState<string | null>(null);
    const [zkProof, setZkProof] = useState<string | null>(null);
    const [copiedData, setCopiedData] = useState<string | null>(null);

    const totalReserves = reserves.reduce((acc, r) => acc + r.amount, 0);
    const isBacked = totalReserves >= circulatingSupply;

    const handleTestFullyBacked = () => {
        setCirculatingSupply(5000000);
        setReserves([
            { id: "1", name: "Treasury T-Bills", amount: 2000000 },
            { id: "2", name: "Cold Wallet BTC", amount: 3000000 },
            { id: "3", name: "Vault Cash", amount: 500000 },
        ]);
    };

    const handleTestUnderCollateralized = () => {
        setCirculatingSupply(5000000);
        setReserves([
            { id: "1", name: "Treasury T-Bills", amount: 1000000 },
            { id: "2", name: "Cold Wallet BTC", amount: 2000000 },
            { id: "3", name: "Vault Cash", amount: 500000 },
        ]);
    };

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
            // 1. DataHaven Encrypt & Upload (or simulated if toggle is on)
            if (simulateUpload) {
                console.log("Simulating DataHaven Upload to bypass Testnet Gas requirements...");
                await new Promise((resolve) => setTimeout(resolve, 2000));
                setDatahavenCID(`dh-cid-${Math.random().toString(36).substring(2, 15)}`);
            } else {
                const dhResult = await encryptAndUploadToDataHaven(payload, privateKey);
                setDatahavenCID(dhResult.cid);
            }

            // 2. Noir ZK Proof Generation
            const amounts = reserves.map((r) => r.amount);
            const proofStr = await generateNoirProof(amounts, circulatingSupply);
            setZkProof(proofStr);
        } catch (e: any) {
            console.error(e);
            if (e?.message?.includes('NotEnoughBalance') || e?.toString().includes('NotEnoughBalance')) {
                alert("DataHaven Network Error: 'NotEnoughBalance' \n\nYour connected developer wallet requires Testnet $MOCK tokens to pay for the StorageHub transaction.\n\nPlease visit the DataHaven Testnet Faucet to fund the wallet, or replace the dummy private key in src/services/clientService.ts with a funded account.");
            } else {
                alert("Error generating proof or uploading to DataHaven. Check the console for details.");
            }
        }

        setIsLoading(false);
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopiedData(type);
        setTimeout(() => setCopiedData(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Issuer Dashboard</h1>
                    <p className="text-sm text-slate-600">Manage protocol reserves, seal data to DataHaven, and generate cryptographic proofs.</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 md:p-8 space-y-8">
                {/* Developer Wallet Config */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center">
                        <ShieldAlert className="w-4 h-4 mr-2 text-amber-500" />
                        Developer Wallet (Testnet MOCK required)
                    </label>
                    <input
                        type="password"
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        placeholder="0x..."
                        className="w-full bg-white border border-slate-300 rounded-md px-4 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-slate-500">Paste a funded Ethereum private key to cover the DataHaven Gas Fees.</p>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="simulateCheck"
                                checked={simulateUpload}
                                onChange={(e) => setSimulateUpload(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                            />
                            <label htmlFor="simulateCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                Skip Upload (Simulate / Faucet Empty)
                            </label>
                        </div>
                    </div>
                </div>

                {/* Top Actions */}
                <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-sm font-semibold text-slate-700 mr-2">Demo Scenarios:</span>
                    <button
                        onClick={handleTestFullyBacked}
                        className="px-4 py-2 text-sm font-medium bg-white text-slate-700 rounded-md border border-slate-300 hover:bg-slate-100 transition-colors"
                    >
                        Fully Backed
                    </button>
                    <button
                        onClick={handleTestUnderCollateralized}
                        className="px-4 py-2 text-sm font-medium bg-white text-red-600 rounded-md border border-red-200 hover:bg-red-50 transition-colors"
                    >
                        Under-collateralized (Danger)
                    </button>
                </div>

                {/* Inputs */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold flex items-center text-slate-900 border-b border-slate-200 pb-2">
                            <Database className="w-5 h-5 mr-2 text-blue-600" />
                            Liabilities
                        </h2>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Total Circulating Supply</label>
                            <input
                                type="number"
                                value={circulatingSupply}
                                onChange={(e) => setCirculatingSupply(Number(e.target.value))}
                                className="w-full bg-white border border-slate-300 rounded-md px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold flex items-center text-slate-900 border-b border-slate-200 pb-2">
                            <ShieldCheck className="w-5 h-5 mr-2 text-emerald-600" />
                            Reserve Assets
                        </h2>
                        <div className="space-y-4">
                            {reserves.map((reserve) => (
                                <div key={reserve.id} className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">{reserve.name}</label>
                                    <input
                                        type="number"
                                        value={reserve.amount}
                                        onChange={(e) => handleUpdateReserve(reserve.id, Number(e.target.value))}
                                        className="w-full bg-white border border-slate-300 rounded-md px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className={`p-4 rounded-md flex items-center justify-between border ${isBacked ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            <div className="font-semibold text-sm">Total Reserves Computed:</div>
                            <div className="font-bold text-lg">${totalReserves.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-6 border-t border-slate-200">
                    <button
                        onClick={handleSealAndProve}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-md transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            "Processing Cryptography & Uploading..."
                        ) : (
                            <>
                                <FileKey className="w-4 h-4 mr-2" />
                                Encrypt, Seal to DataHaven & Generate Proof
                            </>
                        )}
                    </button>
                </div>

                {/* Results */}
                {(datahavenCID || zkProof) && (
                    <div className="space-y-4 pt-6 mt-6 border-t border-slate-200">
                        <h3 className="text-base font-semibold text-slate-900">Generated Artifacts</h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
                                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 flex justify-between">
                                    <span>DataHaven CID</span>
                                    <button onClick={() => copyToClipboard(datahavenCID!, 'cid')} className="text-slate-400 hover:text-slate-900 transition-colors">
                                        {copiedData === 'cid' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="font-mono text-sm text-slate-800 break-all">{datahavenCID}</div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
                                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 flex justify-between">
                                    <span>Noir ZK Proof</span>
                                    <button onClick={() => copyToClipboard(zkProof!, 'proof')} className="text-slate-400 hover:text-slate-900 transition-colors">
                                        {copiedData === 'proof' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="font-mono text-sm text-slate-800 break-all h-10 overflow-hidden line-clamp-2">
                                    {zkProof}
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md text-sm flex items-start mt-4">
                            <ShieldAlert className="w-5 h-5 mr-3 shrink-0 text-blue-600" />
                            <p>
                                <strong>Next Step:</strong> Provide the DataHaven CID and the Noir ZK Proof to the Public Auditor node to cryptographically verify solvency without revealing your reserve breakdowns.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
