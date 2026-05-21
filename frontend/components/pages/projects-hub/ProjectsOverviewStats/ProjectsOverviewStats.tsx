import { BarChart3, CheckCircle2 } from "lucide-react";

interface ProjectsOverviewStatsProps {
    totalJobs: number;
    totalCompleted: number;
    t: (key: string) => string;
}

export default function ProjectsOverviewStats({ totalJobs, totalCompleted, t }: ProjectsOverviewStatsProps) {
    const rate = totalJobs > 0 ? Math.round((totalCompleted / totalJobs) * 100) : 0;
    const pending = totalJobs - totalCompleted;

    return (
        <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{t("projects.totalJobsAll")}</span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                </div>
                <p className="text-3xl font-bold tracking-tight tabular-nums">{totalJobs}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{t("projects.completedAll")}</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold tracking-tight tabular-nums text-emerald-400">{totalCompleted}</p>
                    <span className="text-xs text-slate-600">{rate}%</span>
                </div>
                <div className="mt-2.5 h-[3px] rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-emerald-500/60 rounded-full transition-all duration-700" style={{ width: `${rate}%` }} />
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{t("projects.pendingAll") || "Pending"}</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                </div>
                <p className="text-3xl font-bold tracking-tight tabular-nums text-amber-400">{pending}</p>
            </div>
        </div>
    );
}
