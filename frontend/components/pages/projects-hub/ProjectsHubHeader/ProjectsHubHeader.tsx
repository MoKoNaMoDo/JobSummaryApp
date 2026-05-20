"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectsHubHeaderProps {
    t: (key: string) => string;
    onCreate: () => void;
}

export default function ProjectsHubHeader({ t, onCreate }: ProjectsHubHeaderProps) {
    return (
        <header className="flex items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    {t("projects.hubTitle")}
                </h1>
                <p className="text-slate-400 text-sm mt-1">{t("projects.hubSubtitle")}</p>
            </div>
            <Button
                onClick={onCreate}
                size="lg"
                className="rounded-xl shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white border-0"
            >
                <Plus className="mr-2 h-5 w-5" />
                {t("projects.newProject")}
            </Button>
        </header>
    );
}

