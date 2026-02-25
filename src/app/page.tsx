import Link from "next/link";
import { ShieldCheck, Eye } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[80vh] py-12">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <h1 className="text-4xl text-slate-900 font-bold tracking-tight">
            Cryptographic Proof of Backing
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
            A secure enterprise dashboard for token issuers to mathematically prove protocol solvency.
            Utilizes Noir Zero-Knowledge proofs and DataHaven StorageHub without exposing proprietary ledger data.
          </p>
        </div>

        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link href="/issuer" className="block p-6 bg-white border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Issuer Dashboard</h2>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Input corporate reserves, parameterize ZK cryptographic proofs using Noir, and securely anchor encrypted payloads to DataHaven.
            </p>
            <div className="text-sm text-blue-600 font-medium">
              Access Dashboard →
            </div>
          </Link>

          <Link href="/auditor" className="block p-6 bg-white border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Public Auditor Node</h2>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Independently trace the proof of reserves against the circulating supply using purely algorithmic cryptographic verification.
            </p>
            <div className="text-sm text-blue-600 font-medium">
              Initialize Auditor →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
