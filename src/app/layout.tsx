import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ParseGG — WoW Player Analytics',
  description: 'Stock-market style performance analytics for World of Warcraft players. Know who you\'re inviting.',
  openGraph: {
    title: 'ParseGG — WoW Player Analytics',
    description: 'Distinguish raiders from passengers. Real performance data, not just kill count.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0e11] text-[#d1d4dc] antialiased">
        <header className="border-b border-[#2a2f45] bg-[#131722]">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-tight text-white">
                Parse<span className="text-[#26a69a]">GG</span>
              </span>
              <span className="text-xs text-[#787b86] border border-[#2a2f45] rounded px-2 py-0.5">
                BETA
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-[#787b86]">
              <span className="text-[#d1d4dc] font-medium">Markets</span>
              <span className="hover:text-[#d1d4dc] cursor-pointer">Screener</span>
              <span className="hover:text-[#d1d4dc] cursor-pointer">Top Performers</span>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
