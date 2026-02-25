"use client";

import { useState } from "react";
import { downloadAndDecryptFromDataHaven } from "@/utils/datahaven";
import { verifyNoirProof } from "@/utils/noir";
import { ShieldCheck, ShieldAlert, Search, Database, LockKeyhole } from "lucide-react";

export default function AuditorDashboard() {
    const [datahavenCID, setDatahavenCID] = useState("");
    const [zkProof, setZkProof] = useState("");
    const [circulatingSupply, setCirculatingSupply] = useState<number>(5000000);

    const [verificationState, setVerificationState] = useState<"idle" | "loading" | "success" | "failed">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleVerify = async () => {
        if (!datahavenCID || !zkProof) {
            alert("Please provide both the DataHaven CID and the ZK Proof.");
            return;
        }

        setVerificationState("loading");
        setErrorMessage(null);

        try {
            // 1. Fetch encrypted payload from DataHaven StorageHub
            await downloadAndDecryptFromDataHaven(datahavenCID);

            // 2. Cryptographically verify the ZK Proof
            const result = await verifyNoirProof(zkProof, circulatingSupply);

            if (result.isValid) {
                setVerificationState("success");
            } else {
                setVerificationState("failed");
                setErrorMessage(result.error || "Proof invalid or logic under-collateralized.");
            }
        } catch (e) {
            console.error(e);
            setVerificationState("failed");
            setErrorMessage("Network error verifying proof.");
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="border-b border-slate-200 pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2 flex items-center">
                    <Search className="w-6 h-6 mr-3 text-blue-600" />
                    Public Auditor Node
                </h1>
                <p className="text-sm text-slate-600">
                    Independently verify circulating supply vs. protocol reserves using Noir Zero-Knowledge proofs.
                </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 md:p-8 space-y-6">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center text-slate-700">
                            <Database className="w-4 h-4 mr-2 text-slate-500" />
                            Declared Circulating Supply (Public Input)
                        </label>
                        <input
                            type="number"
                            value={circulatingSupply}
                            onChange={(e) => setCirculatingSupply(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-md px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors font-mono"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center text-slate-700">
                            <LockKeyhole className="w-4 h-4 mr-2 text-slate-500" />
                            DataHaven Payload CID
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. dh-cid-..."
                            value={datahavenCID}
                            onChange={(e) => setDatahavenCID(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center text-slate-700">
                            <ShieldCheck className="w-4 h-4 mr-2 text-slate-500" />
                            Noir ZK Proof (Hex)
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Paste cryptographic proof here..."
                            value={zkProof}
                            onChange={(e) => setZkProof(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors font-mono text-sm resize-none"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                    <button
                        onClick={handleVerify}
                        disabled={verificationState === "loading"}
                        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-md transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {verificationState === "loading" ? "Running Core Computation..." : "Verify Cryptographic Proof"}
                    </button>
                </div>
            </div>

            {/* State UI */}
            {verificationState === "success" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                        <ShieldCheck className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-800">Verified & Secure</h2>
                    <p className="text-emerald-700 text-sm max-w-md">
                        The mathematical proof is valid. The protocol's isolated reserve assets exceed the declared circulating supply.
                    </p>
                </div>
            )}

            {verificationState === "failed" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-red-800">Verification Failed</h2>
                    <p className="text-red-700 text-sm font-semibold max-w-md">
                        WARNING: The zero-knowledge proof algorithm was unable to verify solvency. Either the proof is malformed, or the protocol is mathematically under-collateralized.
                    </p>
                    {errorMessage && (
                        <p className="bg-white text-red-600 px-4 py-3 rounded-md text-xs font-mono mt-4 border border-red-100 w-full text-left">
                            Trace: {errorMessage}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
