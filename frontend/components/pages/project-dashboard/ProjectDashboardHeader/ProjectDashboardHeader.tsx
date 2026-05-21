import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProjectDashboardHeaderProps {
    slug: string;
    t: (key: string) => string;
}

export default function ProjectDashboardHeader({ slug, t }: ProjectDashboardHeaderProps) {
    return (
        <header className="flex items-end justify-between gap-4">
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
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        {t("dashboard.title")}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">{t("dashboard.subtitle")}</p>
                </div>
            </div>
            <Link href={`/projects/${slug}/add`}>
                <Button
                    size="sm"
                    className="rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/30 transition-all shadow-none h-9 px-4"
                >
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t("common.logWork")}
                </Button>
            </Link>
        </header>
    );
}
