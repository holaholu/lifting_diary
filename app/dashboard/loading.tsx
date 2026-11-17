import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid items-start gap-8 md:grid-cols-[auto_1fr]">
        <Skeleton className="h-80 w-72" />
        <Skeleton className="h-40 w-full" />
      </div>
    </main>
  );
}
