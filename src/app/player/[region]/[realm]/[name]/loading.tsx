export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-4 w-24 bg-[#1c2030] rounded mb-6" />
      <div className="bg-[#131722] border border-[#2a2f45] rounded-xl p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#1c2030] rounded-lg" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-[#1c2030] rounded" />
            <div className="h-4 w-24 bg-[#1c2030] rounded" />
            <div className="h-6 w-20 bg-[#1c2030] rounded" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 bg-[#131722] border border-[#2a2f45] rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-20 bg-[#131722] border border-[#2a2f45] rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-[#131722] border border-[#2a2f45] rounded-xl" />
          <div className="h-40 bg-[#131722] border border-[#2a2f45] rounded-xl" />
        </div>
      </div>
    </div>
  )
}
