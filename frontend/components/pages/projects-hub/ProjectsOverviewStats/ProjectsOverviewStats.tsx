import { BarChart3, CheckCircle2, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ProjectsOverviewStatsProps {
    totalJobs: number;
    totalCompleted: number;
    totalCost: number;
    t: (key: string) => string;
}

export default function ProjectsOverviewStats({ totalJobs, totalCompleted, totalCost, t }: ProjectsOverviewStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-slate-800/40 border-slate-700/30 text-white backdrop-blur-sm rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{totalJobs}</p>
                    <p className="text-xs text-slate-400">{t("projects.totalJobsAll")}</p>
                </div>
            </Card>
            <Card className="p-4 bg-slate-800/40 border-slate-700/30 text-white backdrop-blur-sm rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-emerald-400">{totalCompleted}</p>
                    <p className="text-xs text-slate-400">{t("projects.completedAll")}</p>
                </div>
            </Card>
            <Card className="p-4 bg-slate-800/40 border-slate-700/30 text-white backdrop-blur-sm rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-orange-400">{totalCost.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{t("projects.totalCostAll")}</p>
                </div>
            </Card>
        </div>
    );
}

