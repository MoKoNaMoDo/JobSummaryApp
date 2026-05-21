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

const statusAccent: Record<string, { left: string; dot: string }> = {
    Pending:     { left: 'rgba(251,191,36,0.45)',  dot: 'bg-amber-400' },
    InProgress:  { left: 'rgba(96,165,250,0.45)',  dot: 'bg-blue-400' },
    Completed:   { left: 'rgba(52,211,153,0.45)',  dot: 'bg-emerald-400' },
};

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-8 w-32 rounded-lg bg-white/[0.04]" />
                        <Skeleton className="h-32 rounded-xl bg-white/[0.04]" />
                        <Skeleton className="h-32 rounded-xl bg-white/[0.04]" />
                    </div>
                ))}
            </div>
        );
    }

    const colCount = Object.keys(columns).length;

    return (
        <div className={`grid gap-5 ${colCount <= 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
            {Object.entries(columns).map(([colName, items]) => {
                const accent = groupBy === "Status" ? statusAccent[colName] : null;

                return (
                    <div
                        key={colName}
                        className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden"
                        style={accent ? { borderLeftColor: accent.left, borderLeftWidth: '2px' } : undefined}
                    >
                        {/* Column header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                            <div className="flex items-center gap-2">
                                {accent && <span className={`w-2 h-2 rounded-full ${accent.dot}`} />}
                                <h3 className="text-sm font-semibold text-white/70 tracking-wide">
                                    {groupBy === "Status" ? t(`status.${colName}`) : colName}
                                </h3>
                            </div>
                            <span className="text-xs font-mono text-white/20 tabular-nums bg-white/[0.04] px-2 py-0.5 rounded-full">
                                {items.length}
                            </span>
                        </div>

                        {/* Cards */}
                        <div className="p-3 space-y-2.5 min-h-[60px]">
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
                                <div className="text-center py-10 text-white/20 text-xs">
                                    {t("dashboard.noJobs")}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
