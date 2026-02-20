"use client";

import { motion } from "framer-motion";
import { Plus, User, Calendar, DollarSign, ListFilter, CalendarDays, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { jobService } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical, Edit2, Trash2, Camera } from "lucide-react";

// Fallback image using next/image would require domain config. Since they are external Drive links, we disable the linter globally for img inside this file or just use standard img.

// Convert Google Drive URLs to direct-embeddable image URLs
// drive.google.com/file/d/ID/view → lh3.googleusercontent.com/d/ID
// drive.google.com/open?id=ID → lh3.googleusercontent.com/d/ID
// drive.google.com/uc?export=view&id=ID → lh3.googleusercontent.com/d/ID
function getDriveImageUrl(url: string | undefined): string {
  if (!url) return '';
  // Already a direct link
  if (url.includes('lh3.googleusercontent.com')) return url;
  // Extract file ID from various Google Drive URL formats
  let fileId: string | null = null;
  const patterns = [
    /\/d\/([a-zA-Z0-9_-]+)/,           // /file/d/FILE_ID/view
    /[?&]id=([a-zA-Z0-9_-]+)/,         // ?id=FILE_ID or &id=FILE_ID
    /\/open\?id=([a-zA-Z0-9_-]+)/,     // /open?id=FILE_ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) { fileId = match[1]; break; }
  }
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url; // Return as-is if not a Drive URL
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

interface Job {
  id: string;
  date: string;
  taskName: string;
  assignee: string;
  status: "Pending" | "In Progress" | "Completed";
  description: string;
  cost: number;
  imageUrl?: string;
  category?: string;
  amount?: number;
  slipUrl?: string;
  sheetName?: string;
}

import { useLanguage } from "@/components/LanguageProvider";

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<string[]>([]);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeletingDialogOpen, setIsDeletingDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, configData] = await Promise.all([
          jobService.getJobs(),
          jobService.getConfig()
        ]);
        setJobs(jobsData);
        if (configData.data?.users) {
          setUsers(configData.data.users);
        }
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

  const todayStr = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : "";

  const filteredJobs = jobs.filter(j => {
    if (timeFilter === "Today") return j.date === todayStr;
    return true; // All
  });

  const totalCost = filteredJobs.reduce((acc, curr) => acc + (curr.cost || curr.amount || 0), 0);
  const completedCount = filteredJobs.filter(j => j.status === 'Completed').length;
  const totalCount = filteredJobs.length;

  const handleStatusChange = async (job: Job, newStatus: string) => {
    try {
      if (!job.sheetName || !job.id) return;
      await jobService.updateJobStatus(Number(job.id), job.sheetName, newStatus);
      setJobs(jobs.map(j => j.id === job.id && j.sheetName === job.sheetName ? { ...j, status: newStatus as Job["status"] } : j));
      toast.success(t('status.updated') || "Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleEditSave = async () => {
    if (!editingJob || !editingJob.id || !editingJob.sheetName) return;
    try {
      await jobService.updateJob(editingJob as unknown as Record<string, unknown>);
      setJobs(jobs.map(j => j.id === editingJob.id && j.sheetName === editingJob.sheetName ? editingJob : j));
      setIsEditDialogOpen(false);
      toast.success("Job updated successfully");
    } catch {
      toast.error("Failed to update job");
    }
  };

  const handleDelete = async () => {
    if (!jobToDelete || !jobToDelete.id || !jobToDelete.sheetName) return;
    try {
      await jobService.deleteJob(Number(jobToDelete.id), jobToDelete.sheetName);
      setJobs(jobs.filter(j => !(j.id === jobToDelete.id && j.sheetName === jobToDelete.sheetName)));
      setIsDeletingDialogOpen(false);
      setJobToDelete(null);
      toast.success("Job deleted successfully");
    } catch {
      toast.error("Failed to delete job");
    }
  };

  // Dynamic Grouping Logic
  let dynamicColumns: Record<string, Job[]> = {};

  if (groupBy === 'Status') {
    dynamicColumns = {
      Pending: filteredJobs.filter(j => j.status === 'Pending' || !j.status),
      InProgress: filteredJobs.filter(j => j.status === 'In Progress'),
      Completed: filteredJobs.filter(j => j.status === 'Completed')
    };
  } else if (groupBy === 'Category') {
    filteredJobs.forEach(j => {
      const cat = j.taskName || j.category || 'Uncategorized';
      if (!dynamicColumns[cat]) dynamicColumns[cat] = [];
      dynamicColumns[cat].push(j);
    });
  } else if (groupBy === 'Assignee') {
    filteredJobs.forEach(j => {
      const assignee = j.assignee || 'Unassigned';
      if (!dynamicColumns[assignee]) dynamicColumns[assignee] = [];
      dynamicColumns[assignee].push(j);
    });
  }

  // Pre-defined colors for dynamic columns
  const bgColors = [
    "bg-indigo-950/40", "bg-purple-900/30", "bg-blue-950/40", "bg-teal-950/30", "bg-rose-950/30"
  ];
  const textColors = [
    "text-indigo-400", "text-purple-400", "text-blue-400", "text-teal-400", "text-rose-400"
  ];

  const StatusSection = ({ title, items, color, bgColor }: { title: string, items: Job[], color: string, bgColor: string }) => (
    <div className={`space-y-4 p-4 rounded-xl ${bgColor} border border-white/5`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-bold text-lg ${color}`}>{title}</h3>
        <Badge variant="outline" className={`bg-white/10 text-white border-0`}>{items.length}</Badge>
      </div>
      <div className="space-y-4">
        {items.map((job) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className="overflow-hidden border-0 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col rounded-xl relative"
              onClick={() => setViewingJob(job)}
            >
              <CardHeader className="p-4 pb-1 flex flex-row justify-between items-start gap-2 space-y-0 relative z-10">
                <h4 className="font-semibold text-slate-800 line-clamp-2 text-sm leading-snug w-5/6 pr-2">
                  {job.taskName || job.category || t('dashboard.untitled')}
                </h4>
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-slate-100 text-slate-400 opacity-20 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border-slate-200 text-slate-800 shadow-xl rounded-xl">
                      <DropdownMenuItem className="focus:bg-slate-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleStatusChange(job, 'Pending'); }}>
                        <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2" /> {t('dashboard.markPending')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-slate-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleStatusChange(job, 'In Progress'); }}>
                        <span className="w-2 h-2 rounded-full bg-blue-400 mr-2" /> {t('dashboard.markInProgress')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-slate-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleStatusChange(job, 'Completed'); }}>
                        <span className="w-2 h-2 rounded-full bg-green-400 mr-2" /> {t('dashboard.markCompleted')}
                      </DropdownMenuItem>
                      <div className="h-px bg-slate-100 my-1" />
                      <DropdownMenuItem className="focus:bg-slate-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); setEditingJob(job); setIsEditDialogOpen(true); }}>
                        <Edit2 className="w-4 h-4 mr-2" /> {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer" onClick={(e) => { e.stopPropagation(); setJobToDelete(job); setIsDeletingDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex-grow space-y-3 z-10">
                <div className="flex items-center gap-2 text-[11px] font-medium text-purple-700 bg-purple-50 w-fit px-2 py-0.5 rounded flex-wrap">
                  <User className="w-3 h-3" />
                  {job.assignee || t('dashboard.unassigned')}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{job.date.split('-').reverse().slice(0, 2).join('/')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(job.imageUrl || job.slipUrl) && (
                      <div className="flex items-center text-purple-400/50">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {(job.cost || job.amount) ? (
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        <span className="text-green-500 font-bold tracking-tight text-[10px]">฿</span>
                        <span>{(job.cost || job.amount || 0).toLocaleString()}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl text-white/40 text-sm">
            {t('dashboard.noJobs')}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            Kanban Board & Daily Summary
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex bg-white/10 p-1 rounded-xl">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-lg transition-all ${timeFilter === 'Today' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
                onClick={() => setTimeFilter('Today')}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                {t('dashboard.today') || "Today"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-lg transition-all ${timeFilter === 'All' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
                onClick={() => setTimeFilter('All')}
              >
                <ListFilter className="w-4 h-4 mr-2" />
                {t('dashboard.allJobs') || "All Monthly"}
              </Button>
            </div>
            <div className="flex bg-white/10 p-1 rounded-xl">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-lg transition-all ${groupBy === 'Status' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
                onClick={() => setGroupBy('Status')}
              >
                <LayoutTemplate className="w-4 h-4 mr-2" />
                Status
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-lg transition-all ${groupBy === 'Category' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
                onClick={() => setGroupBy('Category')}
              >
                <LayoutTemplate className="w-4 h-4 mr-2" />
                Category
              </Button>
            </div>
          </div>
          <Link href="/add">
            <Button size="lg" className="rounded-full shadow-lg shadow-purple-500/20 bg-purple-600 hover:bg-purple-500 text-white border-0 transition-colors">
              <Plus className="mr-2 h-5 w-5" />
              {t('common.logWork')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Metrics Bar */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-[#1E1B4B]/50 border-purple-900/50 text-white backdrop-blur-xl rounded-2xl">
          <h3 className="text-sm font-medium text-purple-200/60 mb-2">Total Jobs (Today)</h3>
          <p className="text-3xl font-bold">{totalCount}</p>
        </Card>
        <Card className="p-6 bg-[#1E1B4B]/50 border-purple-900/50 text-white backdrop-blur-xl rounded-2xl">
          <h3 className="text-sm font-medium text-purple-200/60 mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-400">{completedCount} <span className="text-sm font-normal text-purple-200/40 ml-1">/{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span></p>
        </Card>
        <Card className="p-6 bg-[#1E1B4B]/50 border-purple-900/50 text-white backdrop-blur-xl rounded-2xl">
          <h3 className="text-sm font-medium text-purple-200/60 mb-2">Total Estimated Cost</h3>
          <p className="text-3xl font-bold text-orange-400">{totalCost.toLocaleString()} THB</p>
        </Card>
      </motion.div>

      {/* Kanban Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full overflow-x-auto pb-6"
      >
        <div className="flex gap-6 min-w-max items-start">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="w-[350px] space-y-4 shrink-0">
                <Skeleton className="h-10 w-full rounded-xl bg-[#1E1B4B]/30" />
                <Skeleton className="h-[200px] w-full rounded-2xl bg-[#1E1B4B]/30" />
              </div>
            ))
          ) : (
            Object.entries(dynamicColumns).map(([colName, items], index) => {
              const titleLabel = (groupBy === 'Status' && (colName === 'Pending' || colName === 'InProgress' || colName === 'Completed'))
                ? t(`status.${colName}`)
                : colName;

              const bgColor = groupBy === 'Status'
                ? (colName === 'Pending' ? "bg-indigo-950/40" : colName === 'InProgress' ? "bg-purple-900/30" : "bg-emerald-950/30")
                : bgColors[index % bgColors.length];

              const textColor = groupBy === 'Status'
                ? (colName === 'Pending' ? "text-indigo-400" : colName === 'InProgress' ? "text-purple-400" : "text-emerald-400")
                : textColors[index % textColors.length];

              return (
                <div key={colName} className="w-[350px] shrink-0">
                  <StatusSection
                    title={titleLabel}
                    items={items}
                    color={textColor}
                    bgColor={bgColor}
                  />
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Edit Job Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Job Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update the specifics below and save your changes.
            </DialogDescription>
          </DialogHeader>
          {editingJob && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="taskName" className="text-right text-slate-300">Task</Label>
                <Input
                  id="taskName"
                  value={editingJob.taskName || editingJob.category || ""}
                  onChange={(e) => setEditingJob({ ...editingJob, taskName: e.target.value })}
                  className="col-span-3 bg-black/40 border-white/10 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right text-slate-300">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editingJob.date}
                  onChange={(e) => setEditingJob({ ...editingJob, date: e.target.value })}
                  className="col-span-3 bg-black/40 border-white/10 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignee-edit" className="text-right text-slate-300">Assignee</Label>
                <div className="col-span-3 relative">
                  <Input
                    id="assignee-edit"
                    list="assignee-edit-list"
                    value={editingJob.assignee}
                    onChange={(e) => setEditingJob({ ...editingJob, assignee: e.target.value })}
                    className="bg-black/40 border-white/10 rounded-xl w-full"
                    placeholder="Type or select a user"
                  />
                  <datalist id="assignee-edit-list">
                    <option value="Unassigned" />
                    {users.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right mt-3 text-slate-300">Notes</Label>
                <Textarea
                  id="description"
                  value={editingJob.description}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                  className="col-span-3 bg-black/40 border-white/10 resize-none rounded-xl"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right text-slate-300">Cost</Label>
                <div className="col-span-3 relative">
                  <Input
                    id="cost"
                    type="number"
                    value={editingJob.cost || editingJob.amount || 0}
                    onChange={(e) => setEditingJob({ ...editingJob, cost: Number(e.target.value) })}
                    className="bg-black/40 border-white/10 rounded-xl pl-8"
                  />
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl hover:bg-white/5" onClick={() => setIsEditDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleEditSave} className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl">{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeletingDialogOpen} onOpenChange={setIsDeletingDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-red-500/20 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> {t('dashboard.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              {t('dashboard.deleteConfirmMsg')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" className="rounded-xl hover:bg-white/5" onClick={() => setIsDeletingDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingJob} onOpenChange={(open) => !open && setViewingJob(null)}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 text-white rounded-2xl overflow-hidden p-0 gap-0">
          <DialogTitle className="sr-only">
            {viewingJob?.taskName || viewingJob?.category || "Job Details"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Viewing detailed job information
          </DialogDescription>
          {viewingJob && (
            <>
              {(viewingJob.imageUrl || viewingJob.slipUrl) && (
                <div className="w-full h-48 bg-slate-800 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getDriveImageUrl(viewingJob.imageUrl || viewingJob.slipUrl)}
                    alt={viewingJob.taskName || viewingJob.category || "Job Image"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                </div>
              )}
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                    {viewingJob.taskName || viewingJob.category || t('dashboard.untitled')}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Badge variant="outline" className={`${viewingJob.status === "Completed" ? "bg-green-500/10 text-green-300 border-green-500/20" : viewingJob.status === "In Progress" ? "bg-blue-500/10 text-blue-300 border-blue-500/20" : "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"}`}>
                      {viewingJob.status}
                    </Badge>
                    <div className="flex items-center text-slate-300 bg-white/5 px-2 py-1 rounded">
                      <User className="w-3 h-3 mr-1.5 opacity-70" />
                      {viewingJob.assignee || t('dashboard.unassigned')}
                    </div>
                    <div className="flex items-center text-slate-300 bg-white/5 px-2 py-1 rounded">
                      <Calendar className="w-3 h-3 mr-1.5 opacity-70" />
                      {viewingJob.date.split('-').reverse().join('/')}
                    </div>
                  </div>
                </div>

                {viewingJob.description && (
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-xl border border-white/5">
                    {viewingJob.description}
                  </div>
                )}

                {(viewingJob.cost || viewingJob.amount) ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                    <span className="text-emerald-200/70 text-sm font-medium">{t('dashboard.totalCost')}</span>
                    <span className="text-xl font-bold text-emerald-400">
                      <DollarSign className="w-5 h-5 inline-block -mt-1 mr-1" />
                      {(viewingJob.cost || viewingJob.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ) : null}

                <div className="flex justify-end pt-4 border-t border-white/10 gap-2">
                  <Button variant="outline" className="text-slate-300 border-white/10 hover:bg-white/10 hover:text-white" onClick={() => { setViewingJob(null); setEditingJob(viewingJob); setIsEditDialogOpen(true); }}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    {t('common.edit')}
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-500 text-white" onClick={() => setViewingJob(null)}>
                    {t('common.done')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
