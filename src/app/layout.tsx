import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'ParseGG — WoW Player Analytics',
  description: 'Stock-market style performance analytics for World of Warcraft players. Know who you\'re inviting.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0e11] text-[#d1d4dc] antialiased">
        <header className="border-b border-[#2a2f45] bg-[#131722] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-tight text-white">
                Parse<span className="text-[#26a69a]">GG</span>
              </span>
              <span className="text-xs text-[#787b86] border border-[#2a2f45] rounded px-2 py-0.5">
                BETA
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-[#787b86] hover:text-[#d1d4dc] transition-colors">
                Search
              </Link>
              <Link href="/compare" className="text-[#787b86] hover:text-[#d1d4dc] transition-colors">
                Compare
              </Link>
              <Link href="/screener" className="text-[#787b86] hover:text-[#d1d4dc] transition-colors">
                Screener
              </Link>
              <Link href="/watchlist" className="text-[#787b86] hover:text-[#d1d4dc] transition-colors flex items-center gap-1">
                <span>★</span> Watchlist
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
