'use client'

import { useState, useEffect, useCallback } from 'react'

export interface WatchlistEntry {
  name: string
  realm: string
  region: string
  class?: string
  spec?: string
  addedAt: string
}

const KEY = 'parsegg_watchlist'

function load(): WatchlistEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(entries: WatchlistEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries))
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([])

  useEffect(() => { setWatchlist(load()) }, [])

  const add = useCallback((entry: Omit<WatchlistEntry, 'addedAt'>) => {
    setWatchlist((prev) => {
      const exists = prev.some(
        (e) => e.name.toLowerCase() === entry.name.toLowerCase() &&
               e.realm.toLowerCase() === entry.realm.toLowerCase() &&
               e.region === entry.region
      )
      if (exists) return prev
      const next = [{ ...entry, addedAt: new Date().toISOString() }, ...prev]
      save(next)
      return next
    })
  }, [])

  const remove = useCallback((name: string, realm: string, region: string) => {
    setWatchlist((prev) => {
      const next = prev.filter(
        (e) => !(e.name.toLowerCase() === name.toLowerCase() &&
                 e.realm.toLowerCase() === realm.toLowerCase() &&
                 e.region === region)
      )
      save(next)
      return next
    })
  }, [])

  const isWatched = useCallback((name: string, realm: string, region: string) =>
    watchlist.some(
      (e) => e.name.toLowerCase() === name.toLowerCase() &&
             e.realm.toLowerCase() === realm.toLowerCase() &&
             e.region === region
    ), [watchlist])

  return { watchlist, add, remove, isWatched }
}
