import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProjectDashboardHeaderProps {
    slug: string;
    t: (key: string) => string;
}

export default function ProjectDashboardHeader({ slug, t }: ProjectDashboardHeaderProps) {
    return (
        <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        {t("dashboard.title")}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">{t("dashboard.subtitle")}</p>
                </div>
            </div>
            <Link href={`/projects/${slug}/add`}>
                <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white border-0 transition-all">
                    <Plus className="mr-2 h-5 w-5" />
                    {t("common.logWork")}
                </Button>
            </Link>
        </header>
    );
}

