"use client";

import { useRouter } from "next/navigation";

export default function OverviewPage() {
  const router = useRouter();

  return (
    <main className="main-content">
      <div className="topbar">
        <div>
          <div className="topbar-title">Overview</div>
          <div className="topbar-sub">// ZK proof of reserves platform</div>
        </div>
        <div className="topbar-right">
          <button className="zv-btn btn-ghost">Docs</button>
          <button className="zv-btn btn-green" onClick={() => router.push("/issuer")}>
            + New Proof
          </button>
        </div>
      </div>
      <div className="overview-body">
        <div className="hero">
          <div className="hero-eyebrow">Zero-Knowledge · Proof of Reserves</div>
          <h1>
            Prove solvency.<br />
            <span>Reveal nothing.</span>
          </h1>
          <p>
            Cryptographically verify your exchange holds sufficient reserves to cover all user liabilities — without exposing a single wallet address or balance.
          </p>
          <div className="hero-ctas">
            <button className="zv-btn btn-green" onClick={() => router.push("/issuer")}>
              Issue a Proof
            </button>
            <button className="zv-btn btn-ghost" onClick={() => router.push("/auditor")}>
              Verify a Proof
            </button>
          </div>
        </div>
        <div className="stats-row">
          <div className="stat-card">
            <div className="sc-label">Total Assets Verified</div>
            <div className="sc-value green">$42.1B</div>
            <div className="sc-sub">↑ $1.4B from last cycle</div>
          </div>
          <div className="stat-card">
            <div className="sc-label">Avg Coverage Ratio</div>
            <div className="sc-value emerald">127%</div>
            <div className="sc-sub">All institutions solvent</div>
          </div>
          <div className="stat-card">
            <div className="sc-label">Proofs Generated</div>
            <div className="sc-value green">1,482</div>
            <div className="sc-sub">Across 6 institutions</div>
          </div>
          <div className="stat-card">
            <div className="sc-label">Avg Proof Time</div>
            <div className="sc-value emerald">0.8s</div>
            <div className="sc-sub">Noir Barretenberg backend</div>
          </div>
        </div>
        <div className="how-grid">
          <div className="how-cell">
            <div className="hc-num">Step 01</div>
            <div className="hc-icon">🧮</div>
            <div className="hc-title">Noir ZK Circuit</div>
            <div className="hc-desc">
              Private wallet balances are passed as secret inputs. The circuit verifies total reserves ≥ total liabilities and outputs a proof — without exposing any balances or addresses.
            </div>
            <span className="hc-tag">Noir v0.31 · Barretenberg</span>
          </div>
          <div className="how-cell">
            <div className="hc-num">Step 02</div>
            <div className="hc-icon">🗄️</div>
            <div className="hc-title">DataHaven StorageHub</div>
            <div className="hc-desc">
              Reserve snapshots are AES-256 encrypted and uploaded to DataHaven&apos;s decentralized network. A Content ID seals the timestamp and guarantees no retroactive tampering.
            </div>
            <span className="hc-tag">AES-256 · DataHaven v2</span>
          </div>
          <div className="how-cell">
            <div className="hc-num">Step 03</div>
            <div className="hc-icon">⚖️</div>
            <div className="hc-title">Public Verification</div>
            <div className="hc-desc">
              Anyone can submit a CID and proof string to the public auditor. A valid proof confirms solvency. A failed proof triggers an insolvency alarm. No trust, no middlemen.
            </div>
            <span className="hc-tag">On-chain Verifier · Open Access</span>
          </div>
        </div>
        <div className="table-card">
          <div className="tc-header">
            <div className="tc-title">Recent Proof Activity</div>
            <div className="tc-sub">All verified on-chain</div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Institution</th>
                <th>DataHaven CID</th>
                <th>Coverage</th>
                <th>Assets</th>
                <th>Proof Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="sdot sdot-green"></span></td>
                <td><strong>Binance</strong></td>
                <td className="mono" style={{ color: "var(--emerald)", fontSize: "11px" }}>bafybei...x4g7k2mz</td>
                <td style={{ color: "var(--green)", fontWeight: 700 }}>127%</td>
                <td>$14.2B</td>
                <td className="mono" style={{ color: "var(--text3)" }}>0.81s</td>
                <td><span className="badge bg-green">✓ Valid</span></td>
              </tr>
              <tr>
                <td><span className="sdot sdot-green"></span></td>
                <td><strong>Coinbase</strong></td>
                <td className="mono" style={{ color: "var(--emerald)", fontSize: "11px" }}>bafyreib...m2n9p3kq</td>
                <td style={{ color: "var(--green)", fontWeight: 700 }}>114%</td>
                <td>$9.1B</td>
                <td className="mono" style={{ color: "var(--text3)" }}>0.79s</td>
                <td><span className="badge bg-green">✓ Valid</span></td>
              </tr>
              <tr>
                <td><span className="sdot sdot-amber"></span></td>
                <td><strong>OKX</strong></td>
                <td className="mono" style={{ color: "var(--emerald)", fontSize: "11px" }}>bafkreid9...q8r4s1lp</td>
                <td style={{ color: "var(--amber)", fontWeight: 700 }}>103%</td>
                <td>$3.8B</td>
                <td className="mono" style={{ color: "var(--text3)" }}>0.88s</td>
                <td><span className="badge bg-amber">⚠ Review</span></td>
              </tr>
              <tr>
                <td><span className="sdot sdot-green"></span></td>
                <td><strong>Kraken</strong></td>
                <td className="mono" style={{ color: "var(--emerald)", fontSize: "11px" }}>bafybeihx...v6w1y7nt</td>
                <td style={{ color: "var(--green)", fontWeight: 700 }}>108%</td>
                <td>$5.2B</td>
                <td className="mono" style={{ color: "var(--text3)" }}>0.76s</td>
                <td><span className="badge bg-green">✓ Valid</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
