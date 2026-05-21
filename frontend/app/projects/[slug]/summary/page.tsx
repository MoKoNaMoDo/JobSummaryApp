"use client";

import { use, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, BarChart3 } from "lucide-react";
import { toast } from "sonner";

import { jobService } from "@/lib/api";
import type { Job } from "@/components/features/JobCard/JobCard";
import { getStatusColors } from "@/lib/statusColors";

const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const DAY_NAMES = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

function formatThaiDate(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return `${DAY_NAMES[date.getDay()]} ${d} ${THAI_MONTHS[m - 1]}`;
}

export default function SummaryPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [monthIdx, setMonthIdx] = useState(today.getMonth()); // 0-indexed
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const m = String(monthIdx + 1).padStart(2, "0");
        const y = String(year);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        jobService
            .getJobs(slug, m, y)
            .then((data) => setJobs(Array.isArray(data) ? data : []))
            .catch(() => toast.error("โหลดงานไม่สำเร็จ"))
            .finally(() => setLoading(false));
    }, [slug, monthIdx, year]);

    const prevMonth = () => {
        if (monthIdx === 0) {
            setMonthIdx(11);
            setYear((y) => y - 1);
        } else {
            setMonthIdx((m) => m - 1);
        }
    };

    const nextMonth = () => {
        if (monthIdx === 11) {
            setMonthIdx(0);
            setYear((y) => y + 1);
        } else {
            setMonthIdx((m) => m + 1);
        }
    };

    const completed = jobs.filter((j) => j.status === "Completed").length;
    const pending = jobs.filter((j) => j.status !== "Completed").length;
    const pct = jobs.length > 0 ? Math.round((completed / jobs.length) * 100) : 0;

    // Group by date, descending
    const groupedByDate = jobs.reduce<Record<string, Job[]>>((acc, job) => {
        if (!acc[job.date]) acc[job.date] = [];
        acc[job.date].push(job);
        return acc;
    }, {});
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

    return (
        <div className="space-y-5">
            {/* Month Navigator */}
            <div className="flex items-center justify-between">
                <button
                    onClick={prevMonth}
                    className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-white">
                        {THAI_MONTHS[monthIdx]} {year}
                    </h2>
                    <p className="text-xs text-slate-600">{jobs.length} งาน</p>
                </div>
                <button
                    onClick={nextMonth}
                    className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <BarChart3 className="w-4 h-4 text-slate-600 mx-auto mb-1.5" />
                    <p className="text-2xl font-bold tabular-nums">{jobs.length}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-wider">ทั้งหมด</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700/60 mx-auto mb-1.5" />
                    <p className="text-2xl font-bold tabular-nums text-emerald-400">{completed}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-wider">เสร็จสิ้น</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <Clock className="w-4 h-4 text-amber-700/60 mx-auto mb-1.5" />
                    <p className="text-2xl font-bold tabular-nums text-amber-400">{pending}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-wider">ค้างอยู่</p>
                </div>
            </div>

            {/* Progress bar */}
            {jobs.length > 0 && (
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600">ความคืบหน้าเดือนนี้</span>
                        <span className="text-slate-500 font-medium">{pct}%</span>
                    </div>
                    <div className="h-[3px] rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                            className="h-full bg-emerald-500/60 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Job list grouped by date */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
                    ))}
                </div>
            ) : sortedDates.length === 0 ? (
                <div className="text-center py-16">
                    <BarChart3 className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                    <p className="text-sm text-slate-600">ไม่มีงานในเดือนนี้</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {sortedDates.map((date) => (
                        <div key={date}>
                            {/* Date header */}
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                                    {formatThaiDate(date)}
                                </span>
                                <div className="flex-1 h-px bg-white/[0.04]" />
                                <span className="text-[10px] text-slate-700 whitespace-nowrap">
                                    {groupedByDate[date].length} งาน
                                </span>
                            </div>

                            {/* Jobs for this date */}
                            <div className="space-y-1.5">
                                {groupedByDate[date].map((job) => {
                                    const colors = getStatusColors(job.status);
                                    return (
                                        <div
                                            key={`${job.id}-${job.sheetName}`}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`}
                                            />
                                            <span className="flex-1 text-sm text-white/80 truncate">
                                                {job.taskName || job.category || "งาน"}
                                            </span>
                                            {job.assignee && (
                                                <span className="text-[10px] text-slate-600 flex-shrink-0">
                                                    {job.assignee}
                                                </span>
                                            )}
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded-md flex-shrink-0 ${colors.bg} ${colors.text}`}
                                            >
                                                {job.status === "Completed"
                                                    ? "เสร็จ"
                                                    : job.status === "In Progress"
                                                    ? "กำลังทำ"
                                                    : "รอ"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
