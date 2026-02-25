import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'zk-Proof of Backing | DataHaven',
  description: 'Cryptographically prove reserves using Noir ZK and DataHaven StorageHub.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen text-slate-900 bg-slate-50 antialiased`}>
        <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white">
                zk
              </div>
              <span className="font-semibold text-lg tracking-tight text-slate-900">Proof of Backing</span>
            </div>
            <div className="flex space-x-6 items-center">
              <a href="/issuer" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                Issuer Dashboard
              </a>
              <a href="/auditor" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                Public Auditor
              </a>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
