import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl font-bold text-[#2a2f45] mb-4">404</p>
      <h2 className="text-xl font-semibold text-white mb-2">Player Not Found</h2>
      <p className="text-sm text-[#787b86] mb-6 max-w-sm">
        This player doesn&apos;t exist on Raider.IO, or the name/realm/region is incorrect.
        Armory characters must have a Raider.IO profile (log into the game at least once in the current patch).
      </p>
      <Link
        href="/"
        className="bg-[#26a69a] hover:bg-[#2bbbad] text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
      >
        Back to Search
      </Link>
    </div>
  )
}
