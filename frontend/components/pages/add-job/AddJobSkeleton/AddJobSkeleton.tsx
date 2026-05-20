import { Skeleton } from "@/components/ui/skeleton";

export default function AddJobSkeleton() {
    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-24">
            <header className="text-center space-y-2">
                <Skeleton className="h-10 w-48 mx-auto bg-white/5" />
                <Skeleton className="h-4 w-64 mx-auto bg-white/5" />
            </header>
            <div className="space-y-6">
                <Skeleton className="h-64 rounded-2xl bg-white/5" />
            </div>
        </div>
    );
}

