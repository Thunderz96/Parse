'use client'

import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center text-center px-4">
      <p className="text-4xl font-bold text-[#ef5350] mb-4">Error</p>
      <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
      <p className="text-sm text-[#787b86] mb-6 max-w-sm">{error.message}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-[#26a69a] hover:bg-[#2bbbad] text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="bg-[#1c2030] hover:bg-[#242838] border border-[#2a2f45] text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Back to Search
        </Link>
      </div>
    </div>
  )
}
