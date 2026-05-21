"use client";

import { BarChart3, CheckCircle2, Clock } from "lucide-react";

interface ProjectDashboardMetricsProps {
    totalCount: number;
    completedCount: number;
    t: (key: string) => string;
}

export default function ProjectDashboardMetrics({ totalCount, completedCount, t }: ProjectDashboardMetricsProps) {
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const pending = totalCount - completedCount;

    return (
        <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{t("dashboard.totalJobs")}</span>
                    <BarChart3 className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <p className="text-3xl font-bold tracking-tight tabular-nums">{totalCount}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{t("dashboard.completedLabel")}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700/60" />
                </div>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold tracking-tight tabular-nums text-emerald-400">{completedCount}</p>
                    <span className="text-xs text-slate-600">{pct}%</span>
                </div>
                <div className="mt-2.5 h-[3px] rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-emerald-500/50 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{t("dashboard.pendingLabel") || "Pending"}</span>
                    <Clock className="w-3.5 h-3.5 text-amber-700/60" />
                </div>
                <p className="text-3xl font-bold tracking-tight tabular-nums text-amber-400">{pending}</p>
            </div>
        </div>
    );
}
