"use client";

import { use } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { jobService } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CompleteWorkLogDialog from "@/components/CompleteWorkLogDialog/CompleteWorkLogDialog";
import DeleteJobDialog from "@/components/DeleteJobDialog/DeleteJobDialog";
import EditJobDialog from "@/components/EditJobDialog/EditJobDialog";
import ViewJobDialog from "@/components/ViewJobDialog/ViewJobDialog";
import type { Job } from "@/components/JobCard/JobCard";
import { useLanguage } from "@/components/LanguageProvider/LanguageProvider";
import ProjectDashboardHeader from "@/components/pages/project-dashboard/ProjectDashboardHeader/ProjectDashboardHeader";
import ProjectDashboardMetrics from "@/components/pages/project-dashboard/ProjectDashboardMetrics/ProjectDashboardMetrics";
import ProjectDashboardToolbar from "@/components/pages/project-dashboard/ProjectDashboardToolbar/ProjectDashboardToolbar";
import ProjectKanbanBoard from "@/components/pages/project-dashboard/ProjectKanbanBoard/ProjectKanbanBoard";

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
  const [completeWorkLogJob, setCompleteWorkLogJob] = useState<Job | null>(null);
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

  const handleCompleteJob = async (job: Job, workLog: string) => {
    try {
      if (!job.sheetName || !job.id) return;
      // Save work log description + set to Completed
      await jobService.updateJob({ ...job, description: workLog, status: 'Completed' } as unknown as Record<string, unknown>);
      setJobs(jobs.map(j =>
        j.id === job.id && j.sheetName === job.sheetName
          ? { ...j, description: workLog, status: 'Completed' }
          : j
      ));
      setCompleteWorkLogJob(null);
      toast.success('✅ บันทึกงานเสร็จสิ้นแล้ว!');
    } catch {
      toast.error('ไม่สามารถบันทึกงานได้ กรุณาลองใหม่');
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
      <ProjectDashboardHeader slug={slug} t={t} />
      <ProjectDashboardToolbar
        searchQuery={searchQuery}
        timeFilter={timeFilter}
        groupBy={groupBy}
        t={t}
        onSearchChange={setSearchQuery}
        onTimeFilterChange={setTimeFilter}
        onGroupByChange={setGroupBy}
      />
      <ProjectDashboardMetrics totalCount={totalCount} completedCount={completedCount} totalCost={totalCost} t={t} />
      <ProjectKanbanBoard
        columns={dynamicColumns}
        loading={loading}
        groupBy={groupBy}
        t={t}
        getDriveImageUrl={getDriveImageUrl}
        onView={setViewingJob}
        onEdit={(job) => { setEditingJob(job); setIsEditDialogOpen(true); }}
        onDelete={(job) => { setJobToDelete(job); setIsDeletingDialogOpen(true); }}
        onStatusChange={handleStatusChange}
        onComplete={setCompleteWorkLogJob}
      />

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

      <CompleteWorkLogDialog
        job={completeWorkLogJob}
        open={!!completeWorkLogJob}
        t={t}
        onComplete={handleCompleteJob}
        onClose={() => setCompleteWorkLogJob(null)}
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
