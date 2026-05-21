"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import CreateProjectDialog from "@/components/dialogs/CreateProjectDialog/CreateProjectDialog";
import { useLanguage } from "@/components/features/LanguageProvider/LanguageProvider";
import ProjectsGrid from "@/components/pages/projects-hub/ProjectsGrid/ProjectsGrid";
import ProjectsHubHeader from "@/components/pages/projects-hub/ProjectsHubHeader/ProjectsHubHeader";
import ProjectsOverviewStats from "@/components/pages/projects-hub/ProjectsOverviewStats/ProjectsOverviewStats";
import { projectService, type Project } from "@/lib/api";

export default function ProjectsHub() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
    fetchProjects();
  }, []);

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

  if (!mounted) return (
    <div className="space-y-8 pb-10 opacity-0">
      <header className="flex items-center justify-between gap-4">
        <div className="h-10 w-48 bg-white/5 animate-pulse rounded-xl" />
        <div className="h-12 w-32 bg-white/5 animate-pulse rounded-xl" />
      </header>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <ProjectsHubHeader t={t} onCreate={() => setCreateOpen(true)} />
      <ProjectsOverviewStats totalJobs={totalJobs} totalCompleted={totalCompleted} t={t} />
      <ProjectsGrid projects={projects} loading={loading} t={t} onCreate={() => setCreateOpen(true)} onDelete={handleDelete} />

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
