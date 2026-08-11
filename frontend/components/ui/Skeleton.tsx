// Reusable skeleton shimmer components for perceived performance during data loading

export function SkeletonCard() {
  return (
    <div className="bg-brandCard rounded-3xl border border-white/10 p-6 animate-pulse space-y-3">
      <div className="h-3 w-28 bg-white/10 rounded-full" />
      <div className="h-8 w-40 bg-white/15 rounded-xl" />
      <div className="h-2.5 w-36 bg-white/8 rounded-full" />
    </div>
  );
}

export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-5">
          <div className="h-3 bg-white/10 rounded-full animate-pulse" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-brandCard rounded-3xl border border-white/10 overflow-hidden">
      <table className="w-full text-left text-xs">
        <thead className="bg-black/60 border-b border-white/10">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="py-4 px-5">
                <div className="h-2.5 w-16 bg-white/10 rounded-full animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-white/10 rounded-2xl animate-pulse" />
        <div className="h-3 w-96 bg-white/8 rounded-full animate-pulse" />
      </div>

      {/* Filter bar */}
      <div className="bg-brandCard rounded-3xl border border-white/10 p-6 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Chart */}
      <div className="bg-brandCard rounded-3xl border border-white/10 p-6 animate-pulse h-64" />

      {/* Table */}
      <SkeletonTable rows={5} cols={6} />
    </div>
  );
}

export function SkeletonEventCard() {
  return (
    <div className="bg-brandCard rounded-3xl border border-white/10 overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-white/10" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/4 bg-white/15 rounded-xl" />
        <div className="h-3 w-1/2 bg-white/8 rounded-full" />
        <div className="h-3 w-2/3 bg-white/8 rounded-full" />
        <div className="flex gap-2 pt-1">
          <div className="h-8 w-24 bg-white/10 rounded-xl" />
          <div className="h-8 w-24 bg-white/10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
