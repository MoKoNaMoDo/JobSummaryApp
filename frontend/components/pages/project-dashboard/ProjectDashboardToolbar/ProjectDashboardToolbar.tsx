"use client";

import { CalendarDays, LayoutTemplate, ListFilter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/30 rounded-2xl backdrop-blur-sm">
            <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                    type="text"
                    placeholder={t("common.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                    className="pl-9 pr-4 h-9 bg-slate-900/50 border-slate-600/30 text-white placeholder:text-slate-500 rounded-xl text-sm"
                />
            </div>
            <div className="h-6 w-px bg-slate-600/30 hidden sm:block" />
            <div className="flex bg-slate-900/50 p-0.5 rounded-lg">
                <Button variant="ghost" size="sm" className={`rounded-md h-8 text-xs px-3 transition-all ${timeFilter === "Today" ? "bg-indigo-500/20 text-indigo-300 shadow-sm" : "text-slate-400 hover:text-white"}`} onClick={() => onTimeFilterChange("Today")}>
                    <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                    {t("dashboard.today")}
                </Button>
                <Button variant="ghost" size="sm" className={`rounded-md h-8 text-xs px-3 transition-all ${timeFilter === "All" ? "bg-indigo-500/20 text-indigo-300 shadow-sm" : "text-slate-400 hover:text-white"}`} onClick={() => onTimeFilterChange("All")}>
                    <ListFilter className="w-3.5 h-3.5 mr-1.5" />
                    {t("dashboard.allJobs")}
                </Button>
            </div>
            <div className="flex bg-slate-900/50 p-0.5 rounded-lg">
                <Button variant="ghost" size="sm" className={`rounded-md h-8 text-xs px-3 transition-all ${groupBy === "Status" ? "bg-indigo-500/20 text-indigo-300 shadow-sm" : "text-slate-400 hover:text-white"}`} onClick={() => onGroupByChange("Status")}>
                    <LayoutTemplate className="w-3.5 h-3.5 mr-1.5" />
                    {t("dashboard.groupByStatus")}
                </Button>
                <Button variant="ghost" size="sm" className={`rounded-md h-8 text-xs px-3 transition-all ${groupBy === "Category" ? "bg-indigo-500/20 text-indigo-300 shadow-sm" : "text-slate-400 hover:text-white"}`} onClick={() => onGroupByChange("Category")}>
                    <LayoutTemplate className="w-3.5 h-3.5 mr-1.5" />
                    {t("dashboard.groupByCategory")}
                </Button>
            </div>
        </div>
    );
}

