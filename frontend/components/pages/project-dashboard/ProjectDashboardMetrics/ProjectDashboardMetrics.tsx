"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

interface ProjectDashboardMetricsProps {
    totalCount: number;
    completedCount: number;
    totalCost: number;
    t: (key: string) => string;
}

export default function ProjectDashboardMetrics({ totalCount, completedCount, totalCost, t }: ProjectDashboardMetricsProps) {
    const completedPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 bg-slate-800/40 border-slate-700/30 text-white backdrop-blur-sm rounded-2xl">
                <h3 className="text-xs font-medium text-slate-400 mb-1">{t("dashboard.totalJobs")}</h3>
                <p className="text-3xl font-bold">{totalCount}</p>
            </Card>
            <Card className="p-5 bg-slate-800/40 border-slate-700/30 text-white backdrop-blur-sm rounded-2xl">
                <h3 className="text-xs font-medium text-slate-400 mb-1">{t("dashboard.completedLabel")}</h3>
                <p className="text-3xl font-bold text-emerald-400">
                    {completedCount} <span className="text-sm font-normal text-slate-500 ml-1">/{completedPercent}%</span>
                </p>
            </Card>
            <Card className="p-5 bg-slate-800/40 border-slate-700/30 text-white backdrop-blur-sm rounded-2xl">
                <h3 className="text-xs font-medium text-slate-400 mb-1">{t("dashboard.estimatedCost")}</h3>
                <p className="text-3xl font-bold text-orange-400">
                    {totalCost.toLocaleString()} <span className="text-sm font-normal text-slate-500">{t("dashboard.currency")}</span>
                </p>
            </Card>
        </motion.div>
    );
}

