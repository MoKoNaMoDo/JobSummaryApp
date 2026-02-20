"use client";

import { motion } from "framer-motion";
import { Plus, User, Calendar, DollarSign, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";

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
  taskName: string; // New Schema
  assignee: string; // New Schema
  status: "Pending" | "In Progress" | "Completed";
  description: string;
  cost: number;
  imageUrl?: string;
  // Fallback for legacy data
  category?: string;
  amount?: number;
  slipUrl?: string;
  sheetName?: string; // Required for updates
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
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const filteredJobs = jobs.filter(j => j.date === selectedDate);
  const totalCost = filteredJobs.reduce((acc, curr) => acc + (curr.cost || curr.amount || 0), 0);
  const completedCount = filteredJobs.filter(j => j.status === 'Completed').length;
  const totalCount = filteredJobs.length;

  const handleStatusChange = async (job: Job, newStatus: string) => {
    try {
      if (!job.sheetName || !job.id) return;
      await jobService.updateJobStatus(Number(job.id), job.sheetName, newStatus);
      setJobs(jobs.map(j => j.id === job.id && j.sheetName === job.sheetName ? { ...j, status: newStatus as any } : j));
      toast.success(t('status.updated') || "Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleEditSave = async () => {
    if (!editingJob || !editingJob.id || !editingJob.sheetName) return;
    try {
      await jobService.updateJob(editingJob);
      setJobs(jobs.map(j => j.id === editingJob.id && j.sheetName === editingJob.sheetName ? editingJob : j));
      setIsEditDialogOpen(false);
      toast.success("Job updated successfully");
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  // Kanban Columns
  const columns = {
    Pending: filteredJobs.filter(j => j.status === 'Pending' || !j.status),
    InProgress: filteredJobs.filter(j => j.status === 'In Progress'),
    Completed: filteredJobs.filter(j => j.status === 'Completed')
  };

  const StatusSection = ({ title, items, color }: { title: string, items: Job[], color: string }) => (
    <div className="space-y-4">
      <div className={`flex items-center justify-between p-2 rounded-lg ${color} bg-opacity-10 border border-white/5`}>
        <h3 className="font-semibold text-lg">{t(`status.${title}`)}</h3>
        <Badge variant="secondary" className="bg-black/20">{items.length}</Badge>
      </div>
      <div className="space-y-4">
        {items.map((job) => (
          <motion.div key={job.id} variants={item}>
            <Card className="overflow-hidden border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors cursor-pointer group flex flex-col">
              {(job.imageUrl || job.slipUrl) && (
                <div className="relative h-32 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <img
                    src={job.imageUrl || job.slipUrl}
                    alt={job.taskName || job.category || t('dashboard.task')}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              )}
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-semibold text-white/90 line-clamp-2 text-base group-hover:text-primary transition-colors">
                    {job.taskName || job.category || t('dashboard.untitled')}
                  </h4>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-muted-foreground self-start shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white shadow-xl">
                      <DropdownMenuItem onClick={() => handleStatusChange(job, 'Pending')}>
                        Mark as <span className="text-yellow-400 ml-1">Pending</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(job, 'In Progress')}>
                        Mark <span className="text-blue-400 ml-1">In Progress</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(job, 'Completed')}>
                        Mark <span className="text-green-400 ml-1">Completed</span>
                      </DropdownMenuItem>
                      <div className="h-px bg-white/10 my-1" />
                      <DropdownMenuItem onClick={() => { setEditingJob(job); setIsEditDialogOpen(true); }}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 focus:bg-red-400/10 focus:text-red-300" onClick={() => { setJobToDelete(job); setIsDeletingDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-grow space-y-2">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {job.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-200/70">
                  <User className="w-3 h-3" />
                  <span>{job.assignee || t('dashboard.unassigned')}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{job.date}</span>
                  </div>
                  {(job.cost || job.amount) ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <DollarSign className="w-3 h-3" />
                      <span>{(job.cost || job.amount || 0).toLocaleString()}</span>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-xl text-muted-foreground/50 text-sm">
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
            Daily Job Summary
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white/5 border-white/10 w-40 text-white"
          />
          <Link href="/add">
            <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white border-0">
              <Plus className="mr-2 h-5 w-5" />
              {t('common.logWork')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Metrics Bar */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white/5 border-white/10 text-white backdrop-blur-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Jobs (Today)</h3>
          <p className="text-3xl font-bold">{totalCount}</p>
        </Card>
        <Card className="p-6 bg-white/5 border-white/10 text-white backdrop-blur-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-400">{completedCount} <span className="text-sm font-normal text-muted-foreground ml-1">/{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span></p>
        </Card>
        <Card className="p-6 bg-white/5 border-white/10 text-white backdrop-blur-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Estimated Cost</h3>
          <p className="text-3xl font-bold text-blue-400">{totalCost.toLocaleString()} THB</p>
        </Card>
      </motion.div>

      {/* Kanban Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-10 w-full rounded-lg bg-white/5" />
              <Skeleton className="h-[200px] w-full rounded-xl bg-white/5" />
            </div>
          ))
        ) : (
          <>
            <StatusSection title="Pending" items={columns.Pending} color="bg-yellow-500" />
            <StatusSection title="In Progress" items={columns.InProgress} color="bg-blue-500" />
            <StatusSection title="Completed" items={columns.Completed} color="bg-green-500" />
          </>
        )}
      </motion.div>

      {/* Edit Job Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription className="text-slate-400">
              Make changes to the job details here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingJob && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="taskName" className="text-right">Task</Label>
                <Input
                  id="taskName"
                  value={editingJob.taskName || editingJob.category || ""}
                  onChange={(e) => setEditingJob({ ...editingJob, taskName: e.target.value })}
                  className="col-span-3 bg-white/5 border-white/10"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editingJob.date}
                  onChange={(e) => setEditingJob({ ...editingJob, date: e.target.value })}
                  className="col-span-3 bg-white/5 border-white/10"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignee" className="text-right">Assignee</Label>
                <Select value={editingJob.assignee} onValueChange={(v) => setEditingJob({ ...editingJob, assignee: v })}>
                  <SelectTrigger className="col-span-3 bg-white/5 border-white/10">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {users.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right mt-2">Desc</Label>
                <Textarea
                  id="description"
                  value={editingJob.description}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                  className="col-span-3 bg-white/5 border-white/10 resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  value={editingJob.cost || editingJob.amount || 0}
                  onChange={(e) => setEditingJob({ ...editingJob, cost: Number(e.target.value) })}
                  className="col-span-3 bg-white/5 border-white/10"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} className="bg-primary text-white">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeletingDialogOpen} onOpenChange={setIsDeletingDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-red-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Job?</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this job? This action cannot be undone and will remove it from the Google Sheet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsDeletingDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
