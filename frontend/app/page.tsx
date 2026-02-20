"use client";

import { motion } from "framer-motion";
import { Plus, User, Calendar, DollarSign, ListFilter, CalendarDays, LayoutTemplate, Search } from "lucide-react";
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
// Uses Google Drive thumbnail API which is the most reliable for embedding
function getDriveImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url === 'UPLOAD_FAILED') return '';
  // Already a direct image link
  if (url.includes('lh3.googleusercontent.com')) return url;
  if (url.includes('/thumbnail?')) return url;
  // Extract file ID from various Google Drive URL formats
  let fileId: string | null = null;
  const patterns = [
    /\/d\/([a-zA-Z0-9_-]{10,})/,        // /file/d/FILE_ID/view
    /[?&]id=([a-zA-Z0-9_-]{10,})/,      // ?id=FILE_ID or &id=FILE_ID
    /\/open\?id=([a-zA-Z0-9_-]{10,})/,  // /open?id=FILE_ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) { fileId = match[1]; break; }
  }
  if (fileId) {
    // Google Drive thumbnail API — most reliable for embedding
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
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
    if (!editingJob || !editingJob.id || !editingJob.sheetName) return;
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
    if (!jobToDelete || !jobToDelete.id || !jobToDelete.sheetName) return;
    try {
      await jobService.deleteJob(Number(jobToDelete.id), jobToDelete.sheetName);
      setJobs(jobs.filter(j => !(j.id === jobToDelete.id && j.sheetName === jobToDelete.sheetName)));
      setIsDeletingDialogOpen(false);
      setJobToDelete(null);
      toast.success(t('dashboard.jobDeleted'));
    } catch {
      toast.error(t('dashboard.deleteFailed'));
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
      const cat = j.taskName || j.category || t('dashboard.untitled');
      if (!dynamicColumns[cat]) dynamicColumns[cat] = [];
      dynamicColumns[cat].push(j);
    });
  } else if (groupBy === 'Assignee') {
    filteredJobs.forEach(j => {
      const assignee = j.assignee || t('dashboard.unassigned');
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
              className="overflow-hidden border border-slate-700/30 bg-slate-800/60 shadow-sm hover:shadow-lg hover:bg-slate-800/80 transition-all cursor-pointer group flex flex-col rounded-xl relative"
              onClick={() => setViewingJob(job)}
            >
              <CardHeader className="p-4 pb-1 flex flex-row justify-between items-start gap-2 space-y-0 relative z-10">
                <h4 className="font-semibold text-white line-clamp-2 text-sm leading-snug w-5/6 pr-2">
                  {job.taskName || job.category || t('dashboard.untitled')}
                </h4>
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10 text-slate-400 opacity-20 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white shadow-xl rounded-xl">
                      <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleStatusChange(job, 'Pending'); }}>
                        <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2" /> {t('dashboard.markPending')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleStatusChange(job, 'In Progress'); }}>
                        <span className="w-2 h-2 rounded-full bg-blue-400 mr-2" /> {t('dashboard.markInProgress')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleStatusChange(job, 'Completed'); }}>
                        <span className="w-2 h-2 rounded-full bg-green-400 mr-2" /> {t('dashboard.markCompleted')}
                      </DropdownMenuItem>
                      <div className="h-px bg-slate-600/50 my-1" />
                      <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={(e) => { e.stopPropagation(); setEditingJob(job); setIsEditDialogOpen(true); }}>
                        <Edit2 className="w-4 h-4 mr-2" /> {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer" onClick={(e) => { e.stopPropagation(); setJobToDelete(job); setIsDeletingDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex-grow space-y-3 z-10">
                <div className="flex items-center gap-2 text-[11px] font-medium text-indigo-300 bg-indigo-500/15 w-fit px-2 py-0.5 rounded flex-wrap">
                  <User className="w-3 h-3" />
                  {job.assignee || t('dashboard.unassigned')}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/30">
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
                      <div className="flex items-center gap-1 font-semibold text-slate-300">
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
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder={t('common.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-10 w-[220px] bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:ring-indigo-500/30 focus:border-indigo-500/30"
            />
          </div>
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
                {t('dashboard.groupByStatus')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-lg transition-all ${groupBy === 'Category' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
                onClick={() => setGroupBy('Category')}
              >
                <LayoutTemplate className="w-4 h-4 mr-2" />
                {t('dashboard.groupByCategory')}
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
          <h3 className="text-sm font-medium text-purple-200/60 mb-2">{t('dashboard.totalJobs')}</h3>
          <p className="text-3xl font-bold">{totalCount}</p>
        </Card>
        <Card className="p-6 bg-[#1E1B4B]/50 border-purple-900/50 text-white backdrop-blur-xl rounded-2xl">
          <h3 className="text-sm font-medium text-purple-200/60 mb-2">{t('dashboard.completedLabel')}</h3>
          <p className="text-3xl font-bold text-green-400">{completedCount} <span className="text-sm font-normal text-purple-200/40 ml-1">/{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span></p>
        </Card>
        <Card className="p-6 bg-[#1E1B4B]/50 border-purple-900/50 text-white backdrop-blur-xl rounded-2xl">
          <h3 className="text-sm font-medium text-purple-200/60 mb-2">{t('dashboard.estimatedCost')}</h3>
          <p className="text-3xl font-bold text-orange-400">{totalCost.toLocaleString()} {t('dashboard.currency')}</p>
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
            <DialogTitle>{t('dashboard.editTitle')}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {t('dashboard.editDescription')}
            </DialogDescription>
          </DialogHeader>
          {editingJob && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="taskName" className="text-right text-slate-300">{t('dashboard.fieldTask')}</Label>
                <Input
                  id="taskName"
                  value={editingJob.taskName || editingJob.category || ""}
                  onChange={(e) => setEditingJob({ ...editingJob, taskName: e.target.value })}
                  className="col-span-3 bg-black/40 border-white/10 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right text-slate-300">{t('dashboard.fieldDate')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={editingJob.date}
                  onChange={(e) => setEditingJob({ ...editingJob, date: e.target.value })}
                  className="col-span-3 bg-black/40 border-white/10 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignee-edit" className="text-right text-slate-300">{t('dashboard.fieldAssignee')}</Label>
                <div className="col-span-3 relative">
                  <Input
                    id="assignee-edit"
                    list="assignee-edit-list"
                    value={editingJob.assignee}
                    onChange={(e) => setEditingJob({ ...editingJob, assignee: e.target.value })}
                    className="bg-black/40 border-white/10 rounded-xl w-full"
                    placeholder={t('dashboard.placeholderAssignee')}
                  />
                  <datalist id="assignee-edit-list">
                    <option value={t('dashboard.unassigned')} />
                    {users.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right mt-3 text-slate-300">{t('dashboard.fieldNotes')}</Label>
                <Textarea
                  id="description"
                  value={editingJob.description}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                  className="col-span-3 bg-black/40 border-white/10 resize-none rounded-xl"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right text-slate-300">{t('dashboard.fieldCost')}</Label>
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
        <DialogContent className="sm:max-w-[520px] bg-slate-900 border-white/10 text-white rounded-2xl overflow-hidden p-0 gap-0">
          <DialogTitle className="sr-only">
            {viewingJob?.taskName || viewingJob?.category || "Job Details"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Viewing detailed job information
          </DialogDescription>
          {viewingJob && (
            <>
              {/* Image Section with fallback */}
              {getDriveImageUrl(viewingJob.imageUrl || viewingJob.slipUrl) && (
                <div className="w-full h-52 bg-slate-800 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getDriveImageUrl(viewingJob.imageUrl || viewingJob.slipUrl)}
                    alt={viewingJob.taskName || viewingJob.category || "Job Image"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const url = viewingJob.imageUrl || viewingJob.slipUrl || '';
                      const match = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
                      if (match?.[1] && !target.src.includes('uc?export')) {
                        target.src = `https://drive.google.com/uc?export=view&id=${match[1]}`;
                      } else {
                        (target.parentElement as HTMLElement).style.display = 'none';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                </div>
              )}

              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-3 leading-tight">
                    {viewingJob.taskName || viewingJob.category || t('dashboard.untitled')}
                  </h2>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Clickable Status Switcher */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 hover:ring-offset-slate-900 ${viewingJob.status === "Completed" ? "bg-emerald-500/20 text-emerald-300 hover:ring-emerald-500/40" :
                          viewingJob.status === "In Progress" ? "bg-blue-500/20 text-blue-300 hover:ring-blue-500/40" :
                            "bg-amber-500/20 text-amber-300 hover:ring-amber-500/40"
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${viewingJob.status === "Completed" ? "bg-emerald-400" :
                            viewingJob.status === "In Progress" ? "bg-blue-400" : "bg-amber-400"
                            }`} />
                          {t(`status.${viewingJob.status}`) || viewingJob.status}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-slate-800 border-slate-700 text-white rounded-xl min-w-[160px]">
                        {["Pending", "In Progress", "Completed"].map(s => (
                          <DropdownMenuItem
                            key={s}
                            className={`cursor-pointer rounded-lg ${viewingJob.status === s ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            onClick={() => {
                              handleStatusChange(viewingJob, s);
                              setViewingJob({ ...viewingJob, status: s as Job["status"] });
                            }}
                          >
                            <span className={`w-2 h-2 rounded-full mr-2 ${s === "Completed" ? "bg-emerald-400" : s === "In Progress" ? "bg-blue-400" : "bg-amber-400"
                              }`} />
                            {t(`status.${s}`) || s}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-1 text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                      <User className="w-3 h-3" />
                      <span>{viewingJob.assignee || t('dashboard.unassigned')}</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                      <Calendar className="w-3 h-3" />
                      <span>{viewingJob.date.split('-').reverse().join('/')}</span>
                    </div>
                  </div>
                </div>

                {/* Description - Dark themed */}
                {viewingJob.description && (
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
                    {viewingJob.description}
                  </div>
                )}

                {/* Cost */}
                {(viewingJob.cost || viewingJob.amount) ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                    <span className="text-emerald-200/70 text-sm font-medium">{t('dashboard.totalCost')}</span>
                    <span className="text-xl font-bold text-emerald-400">
                      ฿ {(viewingJob.cost || viewingJob.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex justify-end pt-4 border-t border-slate-700/50 gap-2">
                  <Button variant="outline" className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white rounded-xl" onClick={() => { setViewingJob(null); setEditingJob(viewingJob); setIsEditDialogOpen(true); }}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    {t('common.edit')}
                  </Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl" onClick={() => setViewingJob(null)}>
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
