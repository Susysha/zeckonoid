"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function OverviewPage() {
  const [block, setBlock] = useState(19204810);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Setup intersection observer for animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("vis");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".stat-cell, .step");
    elements.forEach((el) => observerRef.current?.observe(el));

    // Simulated block counter
    const interval = setInterval(() => {
      setBlock((prev) => prev + 1);
    }, 12000);

    return () => {
      clearInterval(interval);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const formattedBlock = block.toLocaleString().split(',');

  return (
    <main className="app-content">
      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow fade-up d1">
            <div className="ey-line"></div>ZK Proof of Reserves — Protocol v2.4
          </div>
          <h1 className="hero-title">
            <span className="t1 fade-up d2">Prove</span>
            <span className="t2 fade-up d3">Solvency.</span>
            <span className="t3 fade-up d3">Reveal Zero.</span>
          </h1>
          <p className="hero-desc fade-up d4">
            Cryptographically verify your exchange holds <em>100% of user funds</em> without exposing a single wallet address, balance, or trade. <em>Zero trust. Zero exposure. On-chain immutable.</em>
          </p>
          <div className="hero-actions fade-up d5">
            <Link href="/issuer" className="btn-primary">→ Issue a Proof</Link>
            <Link href="/auditor" className="btn-secondary">Verify on-chain</Link>
          </div>
        </div>

        <div className="hero-terminal fade-up d4">
          <div className="corner c-tl"></div><div className="corner c-tr"></div>
          <div className="corner c-bl"></div><div className="corner c-br"></div>
          <div className="t-head">
            <span className="t-title">zeroproof@mainnet:~$</span>
            <span className="t-badge">● LIVE</span>
          </div>
          <div className="t-body">
            <div><span className="tp">❯ </span><span className="tc">zkproof generate --exchange kraken</span></div>
            <div className="to">&nbsp;&nbsp;[....] Fetching commitment tree</div>
            <div className="to">&nbsp;&nbsp;[....] Building Groth16 circuit</div>
            <div className="to">&nbsp;&nbsp;[....] Generating witness</div>
            <div className="to">&nbsp;&nbsp;[....] Proving asset coverage</div>
            <div>&nbsp;</div>
            <div className="ts">&nbsp;&nbsp;[PASS] Assets ≥ Liabilities</div>
            <div className="ts">&nbsp;&nbsp;[PASS] Proof generated: 18ms</div>
            <div className="ts">&nbsp;&nbsp;[PASS] Zero data exposed</div>
            <div className="ts">&nbsp;&nbsp;[PASS] On-chain verified</div>
            <div>&nbsp;</div>
            <div className="to">&nbsp;&nbsp;proof_id&nbsp;&nbsp; <span className="th">0x3f7ac2...e91b</span></div>
            <div className="to">&nbsp;&nbsp;block&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style={{ color: '#e8e8e8' }}>{block.toLocaleString()}</span></div>
            <div className="to">&nbsp;&nbsp;protocol&nbsp;&nbsp; <span style={{ color: '#e8e8e8' }}>Groth16 / BN254</span></div>
            <div className="to">&nbsp;&nbsp;gas_used&nbsp;&nbsp; <span className="tw">214,882</span></div>
            <div>&nbsp;</div>
            <div><span className="tp">❯ </span><span className="tcursor"></span></div>
          </div>
          <div className="t-foot">
            <div className="t-fi">BLOCK <span>{block.toLocaleString()}</span></div>
            <div className="t-fi">LATENCY <span>18ms</span></div>
            <div className="t-fi">STATUS <span>VERIFIED</span></div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-inner">
          <span className="mi ac">ZERO KNOWLEDGE</span><span className="mi">✦ GROTH16</span><span className="mi">✦ BN254 CURVE</span><span className="mi ac">✦ PROOF OF RESERVES</span><span className="mi">✦ ON-CHAIN VERIFIABLE</span><span className="mi">✦ POSEIDON HASH</span><span className="mi ac">✦ MERKLE TREE</span><span className="mi">✦ TRUSTLESS</span><span className="mi">✦ AUDITED</span><span className="mi ac">✦ OPEN SOURCE</span>
          <span className="mi ac">ZERO KNOWLEDGE</span><span className="mi">✦ GROTH16</span><span className="mi">✦ BN254 CURVE</span><span className="mi ac">✦ PROOF OF RESERVES</span><span className="mi">✦ ON-CHAIN VERIFIABLE</span><span className="mi">✦ POSEIDON HASH</span><span className="mi ac">✦ MERKLE TREE</span><span className="mi">✦ TRUSTLESS</span><span className="mi">✦ AUDITED</span><span className="mi ac">✦ OPEN SOURCE</span>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-bar">
        <div className="stat-cell">
          <div className="sl">Reserves Verified</div>
          <div className="sv">$2.4<span className="u">B</span></div>
          <div className="sc up">▲ +$140M 24H</div>
        </div>
        <div className="stat-cell">
          <div className="sl">Avg Proof Time</div>
          <div className="sv">18<span className="u">ms</span></div>
          <div className="sc up">▲ 3ms faster</div>
        </div>
        <div className="stat-cell">
          <div className="sl">Proofs Issued</div>
          <div className="sv">2.8<span className="u">K</span></div>
          <div className="sc up">▲ +84 today</div>
        </div>
        <div className="stat-cell">
          <div className="sl">Data Exposed</div>
          <div className="sv">0<span className="u">B</span></div>
          <div className="sc up">● ALWAYS ZERO</div>
        </div>
      </div>

      {/* PROTOCOL SECTION */}
      <section className="section">
        <div className="sec-hdr">
          <div>
            <div className="sec-num">// 01 — Protocol</div>
            <div className="sec-title glitch">How the<br /><span className="hl">Proof Works</span></div>
          </div>
          <div className="sec-meta">
            Our ZK circuit uses Pedersen commitments in a Merkle tree to prove solvency without exposing user data or exchange balances.
          </div>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-idx">01</div>
            <div className="step-tag">COMMIT</div>
            <div className="step-name">Merkle Commitment</div>
            <div className="step-desc">The exchange constructs a Merkle tree of all user balances using Poseidon hash. Only the root is published — no individual balances or addresses exposed.</div>
          </div>
          <div className="step" style={{ transitionDelay: '0.1s' }}>
            <div className="step-idx">02</div>
            <div className="step-tag">PROVE</div>
            <div className="step-name">ZK Circuit Generation</div>
            <div className="step-desc">A Groth16 circuit generates a zero-knowledge proof that the exchange&apos;s total reserve assets exceed the committed sum of liabilities. Under 20ms.</div>
          </div>
          <div className="step" style={{ transitionDelay: '0.2s' }}>
            <div className="step-idx">03</div>
            <div className="step-tag">VERIFY</div>
            <div className="step-name">On-Chain Verification</div>
            <div className="step-desc">The proof is published on-chain. Any wallet, regulator, or user can verify independently. Immutable. Permissionless. Requires zero trust in the exchange.</div>
          </div>
        </div>
      </section>

      {/* CODE PANEL */}
      <div className="proof-panel">
        <div className="proof-left">
          <div className="corner c-tl"></div>
          <div className="sec-num">// 02 — Cryptography</div>
          <div className="sec-title" style={{ margin: '14px 0 22px' }}>Built on<br /><span className="hl">Real Math</span></div>
          <p style={{ fontSize: '11px', lineHeight: 1.9, color: 'var(--muted)', marginBottom: '28px' }}>
            Battle-tested primitives — the same stack used by leading ZK rollups. Fully audited. Open source. No trusted setup beyond the ceremony.
          </p>
          <div className="ptags">
            <div className="ptag on">Groth16</div>
            <div className="ptag on">BN254</div>
            <div className="ptag on">Poseidon Hash</div>
            <div className="ptag">Pedersen Commit</div>
            <div className="ptag">Merkle Tree</div>
            <div className="ptag">EVM Verifier</div>
            <div className="ptag">snarkjs</div>
            <div className="ptag">circom 2.0</div>
          </div>
        </div>
        <div className="proof-right">
          <div className="code-hdr"><span>circuit.circom</span><span style={{ color: 'var(--green)' }}>● circom 2.0</span></div>
          <div className="code-body">
            <div className="code-line"><span className="ln">1</span><span className="cm">// ZK Proof of Reserves Circuit</span></div>
            <div className="code-line"><span className="ln">2</span><span className="kw">pragma</span> circom <span className="num">2.0.0</span>;</div>
            <div className="code-line"><span className="ln">3</span></div>
            <div className="code-line"><span className="ln">4</span><span className="kw">template</span> <span className="fn">ProofOfReserves</span>(<span className="num">N</span>) {"{"}</div>
            <div className="code-line"><span className="ln">5</span>&nbsp;&nbsp;<span className="cm">// private inputs — never revealed</span></div>
            <div className="code-line"><span className="ln">6</span>&nbsp;&nbsp;<span className="kw">signal private input</span> balances[N];</div>
            <div className="code-line"><span className="ln">7</span>&nbsp;&nbsp;<span className="kw">signal private input</span> totalReserves;</div>
            <div className="code-line"><span className="ln">8</span></div>
            <div className="code-line"><span className="ln">9</span>&nbsp;&nbsp;<span className="cm">// public inputs</span></div>
            <div className="code-line"><span className="ln">10</span>&nbsp;&nbsp;<span className="kw">signal input</span> merkleRoot;</div>
            <div className="code-line"><span className="ln">11</span>&nbsp;&nbsp;<span className="kw">signal output</span> verified;</div>
            <div className="code-line"><span className="ln">12</span></div>
            <div className="code-line"><span className="ln">13</span>&nbsp;&nbsp;<span className="kw">var</span> totalLiab = <span className="fn">sumArray</span>(balances, N);</div>
            <div className="code-line"><span className="ln">14</span>&nbsp;&nbsp;<span className="cm">// assert solvency constraint</span></div>
            <div className="code-line"><span className="ln">15</span>&nbsp;&nbsp;totalReserves - totalLiab &gt;= <span className="num">0</span>;</div>
            <div className="code-line"><span className="ln">16</span>&nbsp;&nbsp;verified &lt;== <span className="fn">MerkleVerify</span>(merkleRoot);</div>
            <div className="code-line"><span className="ln">17</span>{"}"}</div>
          </div>
        </div>
      </div>

      {/* LIVE FEED */}
      <section className="live-section">
        <div className="sec-hdr" style={{ marginBottom: '28px' }}>
          <div>
            <div className="sec-num">// 03 — Explorer</div>
            <div className="sec-title">Live <span className="hl">Proof Feed</span></div>
          </div>
          <div className="status-pill" style={{ alignSelf: 'flex-end', paddingBottom: '6px' }}>UPDATING EVERY BLOCK</div>
        </div>
        <div className="live-grid">
          <div className="proof-table">
            <div className="tbl-head"><span>STATUS</span><span>PROOF HASH</span><span>EXCHANGE</span><span>RESERVES</span><span>TIME</span></div>
            <div className="tbl-row"><div className="rs ok">VERIFIED</div><div className="rhash">0x3f7a...c91b</div><div>Kraken</div><div className="rval">$420.2M</div><div className="rtime">2s ago</div></div>
            <div className="tbl-row"><div className="rs ok">VERIFIED</div><div className="rhash">0x9b2c...f44a</div><div>OKX</div><div className="rval">$1.20B</div><div className="rtime">18s ago</div></div>
            <div className="tbl-row"><div className="rs pd">PENDING</div><div className="rhash">0x1e8f...a203</div><div>Bybit</div><div className="rval">$890.4M</div><div className="rtime">32s ago</div></div>
            <div className="tbl-row"><div className="rs ok">VERIFIED</div><div className="rhash">0xc40d...8e71</div><div>Deribit</div><div className="rval">$312.8M</div><div className="rtime">1m ago</div></div>
            <div className="tbl-row"><div className="rs ok">VERIFIED</div><div className="rhash">0x77ab...2f19</div><div>Bitfinex</div><div className="rval">$540.1M</div><div className="rtime">3m ago</div></div>
          </div>
          <div className="stats-sidebar">
            <div className="s-card"><div className="s-lbl">Total Reserves <span>LIVE</span></div><div className="s-val">$2.4<span className="g">B</span></div><div className="mini-bar"><div className="mini-fill" style={{ width: '82%' }}></div></div><div className="s-sub">82% of registered exchanges</div></div>
            <div className="s-card"><div className="s-lbl">Block Height <span>ETH</span></div><div className="s-val">{formattedBlock[0]},{formattedBlock[1]},<span className="g">{formattedBlock[2]}</span></div></div>
            <div className="s-card"><div className="s-lbl">Proofs Today <span>+84</span></div><div className="s-val">2,<span className="g">841</span></div><div className="mini-bar"><div className="mini-fill" style={{ width: '94%' }}></div></div></div>
            <div className="s-card"><div className="s-lbl">Avg Proof Time</div><div className="s-val">18<span className="g">ms</span></div><div className="s-sub">P99: 24ms · P50: 14ms</div></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-title">
          <span className="stroke">Prove it.</span>
          <span className="fill">On-chain.</span>
        </div>
        <div className="cta-right">
          <p className="cta-desc">Issue a cryptographic proof of solvency in under 20ms. No exposure. No trust. Just math.</p>
          <Link href="/issuer" className="btn-primary" style={{ fontSize: '13px', padding: '18px 36px' }}>→ Issue a Proof</Link>
          <Link href="/auditor" className="btn-secondary">Read the docs</Link>
        </div>
      </section>
    </main>
  );
}
