import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6">
      <Skeleton className="h-96 w-full" />
    </main>
  );
}
