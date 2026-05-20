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
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
    hidden: { y: 20, opacity: 0 },
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-44 rounded-2xl bg-white/5" />
                ))}
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-20 space-y-4">
                <FolderOpen className="w-16 h-16 mx-auto text-slate-600" />
                <h2 className="text-xl font-semibold text-slate-400">{t("projects.empty")}</h2>
                <p className="text-slate-500 text-sm">{t("projects.emptyDesc")}</p>
                <Button onClick={onCreate} className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">
                    <Plus className="mr-2 h-4 w-4" /> {t("projects.newProject")}
                </Button>
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
                <motion.div key={project.id} variants={item}>
                    <Link href={`/projects/${project.slug}`} className="block group">
                        <Card className="relative p-5 bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50 text-white backdrop-blur-sm rounded-2xl transition-all hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 opacity-80" style={{ backgroundColor: project.color }} />
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: `${project.color}30`, color: project.color }}>
                                        {project.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="text-xs text-slate-500">{t("projects.created")} {project.createdAt}</p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(event) => event.preventDefault()}>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white rounded-xl">
                                        <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 cursor-pointer" onClick={(event) => { event.preventDefault(); onDelete(project.id); }}>
                                            <Trash2 className="w-4 h-4 mr-2" /> {t("common.delete")}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700/30">
                                <div className="text-center">
                                    <p className="text-lg font-bold">{project.stats?.total || 0}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t("projects.jobs")}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-emerald-400">{project.stats?.completed || 0}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t("projects.done")}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-orange-400">{(project.stats?.totalCost || 0).toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">฿</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </motion.div>
            ))}
        </motion.div>
    );
}

