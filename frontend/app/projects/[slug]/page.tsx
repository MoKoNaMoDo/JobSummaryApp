"use client";

import { use } from "react";

import { motion } from "framer-motion";
import { Plus, ListFilter, CalendarDays, LayoutTemplate, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { jobService } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageProvider";
import JobCard from "@/components/JobCard";
import ViewJobDialog from "@/components/ViewJobDialog";
import EditJobDialog from "@/components/EditJobDialog";
import DeleteJobDialog from "@/components/DeleteJobDialog";
import type { Job } from "@/components/JobCard";
import { ArrowLeft } from "lucide-react";

export default function ProjectDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  // Convert Google Drive URLs to embeddable thumbnail URLs
  function getDriveImageUrl(url: string | undefined): string {
    if (!url || url === 'UPLOAD_FAILED') return '';
    if (url.includes('lh3.googleusercontent.com') || url.includes('/thumbnail?')) return url;

    const patterns = [
      /\/d\/([a-zA-Z0-9_-]{10,})/,
      /[?&]id=([a-zA-Z0-9_-]{10,})/,
      /\/open\?id=([a-zA-Z0-9_-]{10,})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }

    return url;
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  // --- Main Component ---
  // (slug is available from outer scope)
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<string[]>([]);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeletingDialogOpen, setIsDeletingDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const { t } = useLanguage();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const [jobsData, configData] = await Promise.all([
          jobService.getJobs(slug),
          jobService.getConfig()
        ]);
        setJobs(jobsData);
        if (configData.data?.users) setUsers(configData.data.users);
      } catch (e) {
        console.error("Failed to fetch data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [timeFilter, setTimeFilter] = useState<"Today" | "All">("All");
  const [groupBy, setGroupBy] = useState<"Status" | "Category" | "Assignee">("Status");
  const [searchQuery, setSearchQuery] = useState("");

  const todayStr = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : "";

  const filteredJobs = jobs.filter(j => {
    if (timeFilter === "Today" && j.date !== todayStr) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const dateFormatted = j.date.split('-').reverse().join('/');
      const match =
        (j.taskName || '').toLowerCase().includes(q) ||
        (j.assignee || '').toLowerCase().includes(q) ||
        (j.category || '').toLowerCase().includes(q) ||
        (j.description || '').toLowerCase().includes(q) ||
        dateFormatted.includes(q) ||
        j.date.includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalCost = filteredJobs.reduce((acc, curr) => acc + (curr.cost || curr.amount || 0), 0);
  const completedCount = filteredJobs.filter(j => j.status === 'Completed').length;
  const totalCount = filteredJobs.length;

  // --- Handlers ---

  const handleStatusChange = async (job: Job, newStatus: string) => {
    try {
      if (!job.sheetName || !job.id) return;
      await jobService.updateJobStatus(Number(job.id), job.sheetName, newStatus);
      setJobs(jobs.map(j => j.id === job.id && j.sheetName === job.sheetName ? { ...j, status: newStatus as Job["status"] } : j));
      toast.success(t('dashboard.statusUpdated'));
    } catch {
      toast.error(t('dashboard.statusFailed'));
    }
  };

  const handleEditSave = async () => {
    if (!editingJob) return;
    try {
      await jobService.updateJob(editingJob as unknown as Record<string, unknown>);
      setJobs(jobs.map(j => j.id === editingJob.id && j.sheetName === editingJob.sheetName ? editingJob : j));
      setIsEditDialogOpen(false);
      toast.success(t('dashboard.jobUpdated'));
    } catch {
      toast.error(t('dashboard.updateFailed'));
    }
  };

  const handleDelete = async () => {
    if (!jobToDelete) return;
    try {
      await jobService.deleteJob(Number(jobToDelete.id), jobToDelete.sheetName || '');
      setJobs(jobs.filter(j => !(j.id === jobToDelete.id && j.sheetName === jobToDelete.sheetName)));
      setIsDeletingDialogOpen(false);
      setJobToDelete(null);
      toast.success(t('dashboard.jobDeleted'));
    } catch {
      toast.error(t('dashboard.deleteFailed'));
    }
  };

  // --- Group Jobs into Columns ---

  const dynamicColumns: Record<string, Job[]> = {};

  if (groupBy === 'Status') {
    dynamicColumns['Pending'] = filteredJobs.filter(j => j.status === 'Pending');
    dynamicColumns['InProgress'] = filteredJobs.filter(j => j.status === 'In Progress');
    dynamicColumns['Completed'] = filteredJobs.filter(j => j.status === 'Completed');
  } else if (groupBy === 'Category') {
    filteredJobs.forEach(j => {
      const cat = j.taskName || j.category || t('dashboard.untitled');
      if (!dynamicColumns[cat]) dynamicColumns[cat] = [];
      dynamicColumns[cat].push(j);
    });
  } else {
    filteredJobs.forEach(j => {
      const assignee = j.assignee || t('dashboard.unassigned');
      if (!dynamicColumns[assignee]) dynamicColumns[assignee] = [];
      dynamicColumns[assignee].push(j);
    });
  }

  const bgColors = [
    "bg-indigo-950/40", "bg-purple-900/30", "bg-emerald-900/30",
    "bg-amber-900/30", "bg-rose-900/30", "bg-sky-900/30", "bg-teal-900/30"
  ];

  // --- Kanban Column ---

  const renderColumn = (colName: string, items: Job[], idx: number) => (
    <div key={colName} className={`p-4 rounded-2xl ${bgColors[idx % bgColors.length]} border border-white/5`}>
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-bold text-white tracking-wide">
          {groupBy === 'Status' ? t(`status.${colName}`) : colName}
        </h3>
        <span className="text-xs font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map(job => (
          <JobCard
            key={`${job.sheetName}-${job.id}`}
            job={job}
            t={t}
            getDriveImageUrl={getDriveImageUrl}
            onView={setViewingJob}
            onEdit={(j) => { setEditingJob(j); setIsEditDialogOpen(true); }}
            onDelete={(j) => { setJobToDelete(j); setIsDeletingDialogOpen(true); }}
            onStatusChange={handleStatusChange}
          />
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl text-white/40 text-sm">
            {t('dashboard.noJobs')}
          </div>
        )}
      </div>
    </div>
  );

  // --- Render ---

  if (!mounted) {
    return (
      <div className="space-y-6 pb-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 bg-white/5" />
              <Skeleton className="h-4 w-32 bg-white/5" />
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-32 rounded-lg bg-white/5" />
              <Skeleton className="h-32 rounded-xl bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              {t('dashboard.title')}
            </h1>
            <p className="text-slate-400 text-sm mt-1">{t('dashboard.subtitle')}</p>
          </div>
        </div>
        <Link href={`/projects/${slug}/add`}>
          <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white border-0 transition-all">
            <Plus className="mr-2 h-5 w-5" />
            {t('common.logWork')}
          </Button>
        </Link>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/30 rounded-2xl backdrop-blur-sm">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            type="text"
            placeholder={t('common.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-9 bg-slate-900/50 border-slate-600/30 text-white placeholder:text-slate-500 rounded-xl text-sm"
          />
        </div>
        <div className="h-6 w-px bg-slate-600/30 hidden sm:block" />
        <div className="flex bg-slate-900/50 p-0.5 rounded-lg">
          <Button variant="ghost" size="sm" className={`rounded-md h-8 text-xs px-3 transition-all ${timeFilter === 'Today' ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' : 'text-slate-400 hover:text-white'}`} onClick={() => setTimeFilter('Today')}>
            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
            {t('dashboard.today')}
          </Button>
          <Button variant="ghost" size="sm" className={`rounded-md h-8 text-xs px-3 transition-all ${timeFilter === 'All' ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' : 'text-slate-400 hover:text-white'}`} onClick={() => setTimeFilter('All')}>
            <ListFilter className="w-3.5 h-3.5 mr-1.5" />
            {t('dashboard.allJobs')}
          </Button>
        </div>
        <div className="flex bg-slate-900/50 p-0.5 rounded-lg">
          <Button variant="ghost" size="sm" className={`rounded-md h-8 text-xs px-3 transition-all ${groupBy === 'Status' ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' : 'text-slate-400 hover:text-white'}`} onClick={() => setGroupBy('Status')}>
            <LayoutTemplate className="w-3.5 h-3.5 mr-1.5" />
            {t('dashboard.groupByStatus')}
          </Button>
          <Button variant="ghost" size="sm" className={`rounded-md h-8 text-xs px-3 transition-all ${groupBy === 'Category' ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' : 'text-slate-400 hover:text-white'}`} onClick={() => setGroupBy('Category')}>
            <LayoutTemplate className="w-3.5 h-3.5 mr-1.5" />
            {t('dashboard.groupByCategory')}
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-slate-800/40 border-slate-700/30 text-white backdrop-blur-sm rounded-2xl">
          <h3 className="text-xs font-medium text-slate-400 mb-1">{t('dashboard.totalJobs')}</h3>
          <p className="text-3xl font-bold">{totalCount}</p>
        </Card>
        <Card className="p-5 bg-slate-800/40 border-slate-700/30 text-white backdrop-blur-sm rounded-2xl">
          <h3 className="text-xs font-medium text-slate-400 mb-1">{t('dashboard.completedLabel')}</h3>
          <p className="text-3xl font-bold text-emerald-400">{completedCount} <span className="text-sm font-normal text-slate-500 ml-1">/{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span></p>
        </Card>
        <Card className="p-5 bg-slate-800/40 border-slate-700/30 text-white backdrop-blur-sm rounded-2xl">
          <h3 className="text-xs font-medium text-slate-400 mb-1">{t('dashboard.estimatedCost')}</h3>
          <p className="text-3xl font-bold text-orange-400">{totalCost.toLocaleString()} <span className="text-sm font-normal text-slate-500">{t('dashboard.currency')}</span></p>
        </Card>
      </motion.div>

      {/* Kanban Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-32 rounded-lg bg-white/5" />
              <Skeleton className="h-32 rounded-xl bg-white/5" />
              <Skeleton className="h-32 rounded-xl bg-white/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid gap-6 ${Object.keys(dynamicColumns).length <= 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {Object.entries(dynamicColumns).map(([colName, items], idx) =>
            renderColumn(colName, items, idx)
          )}
        </div>
      )}

      {/* Dialogs */}
      <EditJobDialog
        job={editingJob}
        open={isEditDialogOpen}
        users={users}
        saving={false}
        t={t}
        onJobChange={setEditingJob}
        onSave={handleEditSave}
        onClose={() => setIsEditDialogOpen(false)}
      />

      <DeleteJobDialog
        open={isDeletingDialogOpen}
        t={t}
        onConfirm={handleDelete}
        onClose={() => setIsDeletingDialogOpen(false)}
      />

      <ViewJobDialog
        job={viewingJob}
        t={t}
        getDriveImageUrl={getDriveImageUrl}
        onClose={() => setViewingJob(null)}
        onEdit={(job) => { setEditingJob(job); setIsEditDialogOpen(true); }}
        onStatusChange={(job, status) => {
          handleStatusChange(job, status);
          setViewingJob({ ...job, status: status as Job["status"] });
        }}
      />
    </div>
  );
}
