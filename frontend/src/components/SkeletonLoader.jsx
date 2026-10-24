export function SkeletonCard() {
  return (
    <div className="bg-panel rounded-2xl p-5 border border-white/5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-white/5 rounded" />
          <div className="h-5 w-16 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ lignes = 5, colonnes = 4 }) {
  return (
    <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden animate-pulse">
      <div className="p-5 border-b border-white/5">
        <div className="h-4 w-32 bg-white/5 rounded" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: lignes }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: colonnes }).map((_, j) => (
              <div key={j} className="flex-1 h-6 bg-white/5 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-panel rounded-2xl p-6 border border-white/5 animate-pulse">
      <div className="h-4 w-40 bg-white/5 rounded mb-6" />
      <div className="h-64 flex items-end gap-3">
        {[30, 55, 40, 70, 45, 80, 20].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-white/5 rounded-t-lg"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}