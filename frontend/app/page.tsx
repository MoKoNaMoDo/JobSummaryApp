"use client";

import { motion } from "framer-motion";
import { Plus, FolderOpen, BarChart3, CheckCircle2, DollarSign, Trash2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/components/LanguageProvider";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import { projectService, type Project } from "@/lib/api";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function ProjectsHub() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (e) {
      console.error("Failed to fetch projects", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (name: string, color: string) => {
    const project = await projectService.create(name, color);
    setProjects(prev => [...prev, { ...project, stats: { total: 0, completed: 0, totalCost: 0 } }]);
    toast.success(t('projects.created'));
  };

  const handleDelete = async (id: string) => {
    try {
      await projectService.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success(t('projects.deleted'));
    } catch {
      toast.error(t('projects.deleteFailed'));
    }
  };

  // Summary stats across all projects
  const totalJobs = projects.reduce((s, p) => s + (p.stats?.total || 0), 0);
  const totalCompleted = projects.reduce((s, p) => s + (p.stats?.completed || 0), 0);
  const totalCost = projects.reduce((s, p) => s + (p.stats?.totalCost || 0), 0);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {t('projects.hubTitle')}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{t('projects.hubSubtitle')}</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          size="lg"
          className="rounded-xl shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white border-0"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t('projects.newProject')}
        </Button>
      </header>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-800/40 border-slate-700/30 text-white backdrop-blur-sm rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalJobs}</p>
            <p className="text-xs text-slate-400">{t('projects.totalJobsAll')}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-800/40 border-slate-700/30 text-white backdrop-blur-sm rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{totalCompleted}</p>
            <p className="text-xs text-slate-400">{t('projects.completedAll')}</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-800/40 border-slate-700/30 text-white backdrop-blur-sm rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-400">{totalCost.toLocaleString()}</p>
            <p className="text-xs text-slate-400">{t('projects.totalCostAll')}</p>
          </div>
        </Card>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-44 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <FolderOpen className="w-16 h-16 mx-auto text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-400">{t('projects.empty')}</h2>
          <p className="text-slate-500 text-sm">{t('projects.emptyDesc')}</p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">
            <Plus className="mr-2 h-4 w-4" /> {t('projects.newProject')}
          </Button>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <motion.div key={project.id} variants={item}>
              <Link href={`/projects/${project.slug}`} className="block group">
                <Card className="relative p-5 bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50 text-white backdrop-blur-sm rounded-2xl transition-all hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer overflow-hidden">
                  {/* Color accent */}
                  <div className="absolute top-0 left-0 w-full h-1 opacity-80" style={{ backgroundColor: project.color }} />

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: project.color + '30', color: project.color }}>
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-xs text-slate-500">{t('projects.created')} {project.createdAt}</p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white rounded-xl">
                        <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 cursor-pointer" onClick={(e) => { e.preventDefault(); handleDelete(project.id); }}>
                          <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700/30">
                    <div className="text-center">
                      <p className="text-lg font-bold">{project.stats?.total || 0}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t('projects.jobs')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-400">{project.stats?.completed || 0}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t('projects.done')}</p>
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
      )}

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
