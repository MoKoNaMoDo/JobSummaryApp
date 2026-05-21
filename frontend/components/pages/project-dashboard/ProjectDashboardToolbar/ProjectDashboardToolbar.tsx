"use client";

import { CalendarDays, ListFilter, LayoutTemplate, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type TimeFilter = "Today" | "All";
type GroupBy = "Status" | "Category" | "Assignee";

interface ProjectDashboardToolbarProps {
    searchQuery: string;
    timeFilter: TimeFilter;
    groupBy: GroupBy;
    t: (key: string) => string;
    onSearchChange: (value: string) => void;
    onTimeFilterChange: (value: TimeFilter) => void;
    onGroupByChange: (value: GroupBy) => void;
}

function SegmentedButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all duration-150 ${
                active
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
        >
            {children}
        </button>
    );
}

export default function ProjectDashboardToolbar({
    searchQuery,
    timeFilter,
    groupBy,
    t,
    onSearchChange,
    onTimeFilterChange,
    onGroupByChange,
}: ProjectDashboardToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-sm">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <Input
                    type="text"
                    placeholder={t("common.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-8 pr-3 h-9 bg-transparent border-0 text-white placeholder:text-slate-600 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                />
            </div>

            <div className="w-px h-5 bg-white/[0.06] hidden sm:block" />

            {/* Time filter */}
            <div className="flex items-center gap-0.5 bg-white/[0.03] p-0.5 rounded-xl">
                <SegmentedButton active={timeFilter === "Today"} onClick={() => onTimeFilterChange("Today")}>
                    <CalendarDays className="w-3 h-3" />
                    {t("dashboard.today")}
                </SegmentedButton>
                <SegmentedButton active={timeFilter === "All"} onClick={() => onTimeFilterChange("All")}>
                    <ListFilter className="w-3 h-3" />
                    {t("dashboard.allJobs")}
                </SegmentedButton>
            </div>

            <div className="w-px h-5 bg-white/[0.06] hidden sm:block" />

            {/* Group by */}
            <div className="flex items-center gap-0.5 bg-white/[0.03] p-0.5 rounded-xl">
                <SegmentedButton active={groupBy === "Status"} onClick={() => onGroupByChange("Status")}>
                    <LayoutTemplate className="w-3 h-3" />
                    {t("dashboard.groupByStatus")}
                </SegmentedButton>
                <SegmentedButton active={groupBy === "Assignee"} onClick={() => onGroupByChange("Assignee")}>
                    {t("dashboard.groupByAssignee") || "Assignee"}
                </SegmentedButton>
            </div>
        </div>
    );
}
