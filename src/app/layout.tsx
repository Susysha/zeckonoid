import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'ZK PROOF — Cryptographic Solvency Protocol',
  description: 'Cryptographically prove reserves using Noir ZK and DataHaven StorageHub.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <div className="grid-bg"></div>

          {/* TICKER */}
          <div className="ticker">
            <div className="ticker-inner">
              <span className="ticker-item">BTC/USDT <span className="up">▲ $67,240</span></span>
              <span className="ticker-item">ETH/USDT <span className="up">▲ $3,842</span></span>
              <span className="ticker-item">PROOF TIME <span className="up">18ms AVG</span></span>
              <span className="ticker-item">RESERVES <span className="up">$2.4B VERIFIED</span></span>
              <span className="ticker-item">SOL/USDT <span className="dn">▼ $182</span></span>
              <span className="ticker-item">ACTIVE PROOFS <span className="up">2,841</span></span>
              <span className="ticker-item">NETWORK <span className="up">● ONLINE</span></span>
              <span className="ticker-item">BNB/USDT <span className="up">▲ $524</span></span>
              <span className="ticker-item">CIRCUIT <span className="up">Groth16 / BN254</span></span>
              <span className="ticker-item">GAS <span className="dn">12 GWEI</span></span>
              {/* Duplicate for infinite marquee effect */}
              <span className="ticker-item">BTC/USDT <span className="up">▲ $67,240</span></span>
              <span className="ticker-item">ETH/USDT <span className="up">▲ $3,842</span></span>
              <span className="ticker-item">PROOF TIME <span className="up">18ms AVG</span></span>
              <span className="ticker-item">RESERVES <span className="up">$2.4B VERIFIED</span></span>
              <span className="ticker-item">SOL/USDT <span className="dn">▼ $182</span></span>
              <span className="ticker-item">ACTIVE PROOFS <span className="up">2,841</span></span>
              <span className="ticker-item">NETWORK <span className="up">● ONLINE</span></span>
              <span className="ticker-item">BNB/USDT <span className="up">▲ $524</span></span>
              <span className="ticker-item">CIRCUIT <span className="up">Groth16 / BN254</span></span>
              <span className="ticker-item">GAS <span className="dn">12 GWEI</span></span>
            </div>
          </div>

          {/* NAV */}
          <NavBar />

          {children}

          {/* FOOTER */}
          <footer>
            <div className="footer-logo">ZEROPROOF PROTOCOL v2.4</div>
            <ul className="footer-links">
              <li><a href="#">Github</a></li>
              <li><a href="#">Docs</a></li>
              <li><a href="#">Audit Reports</a></li>
              <li><a href="#">Explorer</a></li>
              <li><a href="#">Privacy</a></li>
            </ul>
            <div className="footer-copy">© 2026 ZEROPROOF. ALL RIGHTS RESERVED.</div>
          </footer>

        </ThemeProvider>
      </body>
    </html>
  );
}
