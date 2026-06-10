import { twMerge } from 'tailwind-merge';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={twMerge('animate-pulse rounded-md bg-slate-200', className)}
    />
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

export function FeaturedNewsSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white md:flex">
      <Skeleton className="aspect-[16/9] h-64 w-full rounded-none md:h-auto md:w-1/2" />
      <div className="flex flex-1 flex-col justify-center space-y-3 p-6">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
