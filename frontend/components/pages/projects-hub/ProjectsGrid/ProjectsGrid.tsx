"use client";

import { motion } from "framer-motion";
import { FolderOpen, MoreVertical, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project } from "@/lib/api";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
    hidden: { y: 16, opacity: 0 },
    show: { y: 0, opacity: 1 },
};

interface ProjectsGridProps {
    projects: Project[];
    loading: boolean;
    t: (key: string) => string;
    onCreate: () => void;
    onDelete: (id: string) => void;
}

export default function ProjectsGrid({ projects, loading, t, onCreate, onDelete }: ProjectsGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-2xl bg-white/[0.03]" />
                ))}
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-24 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
                    <FolderOpen className="w-8 h-8 text-slate-600" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-base font-semibold text-slate-300">{t("projects.empty")}</h2>
                    <p className="text-slate-600 text-sm">{t("projects.emptyDesc")}</p>
                </div>
                <Button onClick={onCreate} className="mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">
                    <Plus className="mr-2 h-4 w-4" /> {t("projects.newProject")}
                </Button>
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => {
                const total = project.stats?.total || 0;
                const completed = project.stats?.completed || 0;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                    <motion.div key={project.id} variants={item}>
                        <Link href={`/projects/${project.slug}`} className="block group">
                            <Card className="relative p-5 bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] text-white backdrop-blur-sm rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-xl"
                                style={{ ['--glow' as string]: project.color }}
                            >
                                {/* Top accent line */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-[2px]"
                                    style={{ background: `linear-gradient(90deg, ${project.color}cc 0%, ${project.color}00 70%)` }}
                                />

                                <div className="flex items-start justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                                            style={{ backgroundColor: `${project.color}20`, color: project.color }}
                                        >
                                            {project.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-white group-hover:text-white/90 transition-colors truncate">
                                                {project.name}
                                            </h3>
                                            <p className="text-[11px] text-slate-600 mt-0.5">{project.createdAt}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-slate-600 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white rounded-xl">
                                            <DropdownMenuItem
                                                className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
                                                onClick={(e) => { e.preventDefault(); onDelete(project.id); }}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" /> {t("common.delete")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="text-center py-2 rounded-xl bg-white/[0.03]">
                                        <p className="text-lg font-bold tabular-nums">{total}</p>
                                        <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">{t("projects.jobs")}</p>
                                    </div>
                                    <div className="text-center py-2 rounded-xl bg-white/[0.03]">
                                        <p className="text-lg font-bold tabular-nums text-emerald-400">{completed}</p>
                                        <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">{t("projects.done")}</p>
                                    </div>
                                    <div className="text-center py-2 rounded-xl bg-white/[0.03]">
                                        <p className="text-lg font-bold tabular-nums text-amber-400">{total - completed}</p>
                                        <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">{t("projects.pending") || "Pending"}</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-600">Progress</span>
                                        <span className="text-[10px] font-medium text-slate-500">{pct}%</span>
                                    </div>
                                    <div className="h-[3px] rounded-full bg-white/5 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{ width: `${pct}%`, backgroundColor: `${project.color}cc` }}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
