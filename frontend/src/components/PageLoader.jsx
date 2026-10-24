import { Loader2 } from "lucide-react";

export default function PageLoader({ message = "Chargement..." }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center animate-fade-in">
      <div className="text-center">
        <div className="relative inline-flex mb-4">
          <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
          <div className="relative bg-accent/10 p-4 rounded-full">
            <Loader2 size={32} className="animate-spin text-accent" />
          </div>
        </div>
        <p className="text-sm text-gray-400 animate-pulse">{message}</p>
      </div>
    </div>
  );
}

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

export function SkeletonListe({ lignes = 4 }) {
  return (
    <div className="bg-panel rounded-2xl border border-white/5 p-4 space-y-3 animate-pulse">
      {Array.from({ length: lignes }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-white/5 rounded" />
            <div className="h-3 w-20 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}