"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutGrid, CalendarDays, BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = [
    { key: "", icon: LayoutGrid, labelTh: "บันทึกงาน" },
    { key: "calendar", icon: CalendarDays, labelTh: "ปฏิทิน" },
    { key: "summary", icon: BarChart3, labelTh: "สรุปงาน" },
] as const;

function formatProjectName(slug: string): string {
    return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const parts = pathname.split("/").filter(Boolean);
    // parts = ['projects', slug, 'calendar'|'summary'|'add'|undefined]
    const slug = parts[1] || "";
    const subpage = parts[2] || "";
    const isAddPage = subpage === "add";

    const isActiveTab = (key: string) => {
        if (key === "") return subpage === "" || !subpage;
        return subpage === key;
    };

    return (
        <div className="pb-10">
            {!isAddPage ? (
                <div className="space-y-5">
                    {/* Shared project header */}
                    <header className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link href="/">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-xl text-slate-600 hover:text-white hover:bg-white/[0.06] h-9 w-9 shrink-0"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <h1 className="text-xl font-semibold tracking-tight text-white/90">
                                {formatProjectName(slug)}
                            </h1>
                        </div>
                        <Link href={`/projects/${slug}/add`}>
                            <Button
                                size="sm"
                                className="rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/30 transition-all shadow-none h-9 px-4"
                            >
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                บันทึกงาน
                            </Button>
                        </Link>
                    </header>

                    {/* Tab navigation */}
                    <nav className="flex items-center border-b border-white/[0.06]">
                        {TABS.map((tab) => {
                            const href = tab.key
                                ? `/projects/${slug}/${tab.key}`
                                : `/projects/${slug}`;
                            const active = isActiveTab(tab.key);
                            const Icon = tab.icon;
                            return (
                                <Link key={tab.key} href={href}>
                                    <button
                                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all duration-150 ${
                                            active
                                                ? "text-white border-indigo-500"
                                                : "text-slate-500 border-transparent hover:text-slate-300 hover:border-white/[0.12]"
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {tab.labelTh}
                                    </button>
                                </Link>
                            );
                        })}
                    </nav>

                    <div>{children}</div>
                </div>
            ) : (
                <div className="space-y-5">
                    <header className="flex items-center gap-3">
                        <Link href={`/projects/${slug}`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl text-slate-600 hover:text-white hover:bg-white/[0.06] h-9 w-9 shrink-0"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-semibold tracking-tight text-white/90">
                            {formatProjectName(slug)}
                        </h1>
                    </header>
                    {children}
                </div>
            )}
        </div>
    );
}
