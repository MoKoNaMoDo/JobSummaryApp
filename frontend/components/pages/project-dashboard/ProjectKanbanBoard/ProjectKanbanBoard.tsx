import { Skeleton } from "@/components/ui/skeleton";
import JobCard from "@/components/features/JobCard/JobCard";
import type { Job } from "@/components/features/JobCard/JobCard";

type GroupBy = "Status" | "Category" | "Assignee";

interface ProjectKanbanBoardProps {
    columns: Record<string, Job[]>;
    loading: boolean;
    groupBy: GroupBy;
    t: (key: string) => string;
    getDriveImageUrl: (url: string | undefined) => string;
    onView: (job: Job) => void;
    onEdit: (job: Job) => void;
    onDelete: (job: Job) => void;
    onStatusChange: (job: Job, status: string) => void;
    onComplete: (job: Job) => void;
}

const bgColors = [
    "bg-indigo-950/40", "bg-purple-900/30", "bg-emerald-900/30",
    "bg-amber-900/30", "bg-rose-900/30", "bg-sky-900/30", "bg-teal-900/30",
];

export default function ProjectKanbanBoard({
    columns,
    loading,
    groupBy,
    t,
    getDriveImageUrl,
    onView,
    onEdit,
    onDelete,
    onStatusChange,
    onComplete,
}: ProjectKanbanBoardProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-8 w-32 rounded-lg bg-white/5" />
                        <Skeleton className="h-32 rounded-xl bg-white/5" />
                        <Skeleton className="h-32 rounded-xl bg-white/5" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`grid gap-6 ${Object.keys(columns).length <= 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
            {Object.entries(columns).map(([colName, items], idx) => (
                <div key={colName} className={`p-4 rounded-2xl ${bgColors[idx % bgColors.length]} border border-white/5`}>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-sm font-bold text-white tracking-wide">
                            {groupBy === "Status" ? t(`status.${colName}`) : colName}
                        </h3>
                        <span className="text-xs font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{items.length}</span>
                    </div>
                    <div className="space-y-3">
                        {items.map((job) => (
                            <JobCard
                                key={`${job.sheetName}-${job.id}`}
                                job={job}
                                t={t}
                                getDriveImageUrl={getDriveImageUrl}
                                onView={onView}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onStatusChange={onStatusChange}
                                onComplete={onComplete}
                            />
                        ))}
                        {items.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl text-white/40 text-sm">
                                {t("dashboard.noJobs")}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
