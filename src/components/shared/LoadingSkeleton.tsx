interface LoadingSkeletonProps {
  className?: string;
}

// Generic skeleton line
export function Skeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
      aria-hidden="true"
    />
  );
}

// Page-level loading skeleton
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-label="Loading page content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Content cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-3">
          <Skeleton className="h-4 w-32" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-5 py-3 last:border-b-0">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Card-level loading skeleton
export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5" aria-busy="true">
      <Skeleton className="mb-3 h-4 w-32" />
      <Skeleton className="mb-2 h-6 w-20" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// Table row loading skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3" aria-busy="true">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
