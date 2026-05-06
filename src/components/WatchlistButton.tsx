'use client'

import { Star } from 'lucide-react'
import { useWatchlist } from '@/hooks/useWatchlist'
import { PlayerProfile } from '@/lib/types'

export default function WatchlistButton({ profile }: { profile: PlayerProfile }) {
  const { add, remove, isWatched } = useWatchlist()
  const watched = isWatched(profile.name, profile.realm, profile.region)

  function toggle() {
    if (watched) {
      remove(profile.name, profile.realm, profile.region)
    } else {
      add({ name: profile.name, realm: profile.realm, region: profile.region, class: profile.class, spec: profile.spec })
    }
  }

  return (
    <button
      onClick={toggle}
      title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
      className={`flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-colors ${
        watched
          ? 'bg-[#1a1a0a] border-[#ffa726] text-[#ffa726]'
          : 'bg-[#1c2030] border-[#2a2f45] text-[#787b86] hover:text-white hover:border-[#787b86]'
      }`}
    >
      <Star className={`w-3.5 h-3.5 ${watched ? 'fill-[#ffa726]' : ''}`} />
      {watched ? 'Watching' : 'Watch'}
    </button>
  )
}
