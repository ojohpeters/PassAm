export default function Loading() {
  return (
    <div className="min-h-full space-y-6 p-4 pb-12 md:p-6">
      {/* Hero skeleton */}
      <div className="h-44 animate-pulse rounded-3xl bg-muted" />
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      {/* Achievements skeleton */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      {/* Calendar skeleton */}
      <div className="h-36 animate-pulse rounded-2xl bg-muted" />
    </div>
  )
}
