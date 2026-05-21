"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectsHubHeaderProps {
    t: (key: string) => string;
    onCreate: () => void;
}

export default function ProjectsHubHeader({ t, onCreate }: ProjectsHubHeaderProps) {
    return (
        <header className="flex items-end justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    {t("projects.hubTitle")}
                </h1>
                <p className="text-slate-500 text-sm mt-1">{t("projects.hubSubtitle")}</p>
            </div>
            <Button
                onClick={onCreate}
                size="sm"
                className="rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20 transition-all shadow-none h-9 px-4"
            >
                <Plus className="mr-1.5 h-4 w-4" />
                {t("projects.newProject")}
            </Button>
        </header>
    );
}
