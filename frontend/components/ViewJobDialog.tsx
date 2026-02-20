"use client";

import { User, Calendar, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getStatusColors, ALL_STATUSES } from "@/lib/statusColors";
import type { Job } from "./JobCard";

interface ViewJobDialogProps {
    job: Job | null;
    t: (key: string) => string;
    getDriveImageUrl: (url: string | undefined) => string;
    onClose: () => void;
    onEdit: (job: Job) => void;
    onStatusChange: (job: Job, status: string) => void;
}

export default function ViewJobDialog({ job, t, getDriveImageUrl, onClose, onEdit, onStatusChange }: ViewJobDialogProps) {
    if (!job) return null;

    const colors = getStatusColors(job.status);
    const imageUrl = getDriveImageUrl(job.imageUrl || job.slipUrl);

    return (
        <Dialog open={!!job} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[520px] bg-slate-900 border-white/10 text-white rounded-2xl overflow-hidden p-0 gap-0">
                <DialogTitle className="sr-only">
                    {job.taskName || job.category || t('dashboard.viewDetails')}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    {t('dashboard.viewDetailsDesc')}
                </DialogDescription>

                {/* Image */}
                {imageUrl && (
                    <div className="w-full h-52 bg-slate-800 relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt={job.taskName || job.category || ""}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const url = job.imageUrl || job.slipUrl || '';
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
                    {/* Title + Metadata */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-3 leading-tight">
                            {job.taskName || job.category || t('dashboard.untitled')}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            {/* Clickable Status Badge */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 hover:ring-offset-slate-900 ${colors.bg} ${colors.text} ${colors.ring}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                        {t(`status.${job.status}`) || job.status}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="bg-slate-800 border-slate-700 text-white rounded-xl min-w-[160px]">
                                    {ALL_STATUSES.map(s => {
                                        const sColors = getStatusColors(s);
                                        return (
                                            <DropdownMenuItem
                                                key={s}
                                                className={`cursor-pointer rounded-lg ${job.status === s ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                                onClick={() => onStatusChange(job, s)}
                                            >
                                                <span className={`w-2 h-2 rounded-full mr-2 ${sColors.dot}`} />
                                                {t(`status.${s}`) || s}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex items-center gap-1 text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                                <User className="w-3 h-3" />
                                <span>{job.assignee || t('dashboard.unassigned')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                                <Calendar className="w-3 h-3" />
                                <span>{job.date.split('-').reverse().join('/')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {job.description && (
                        <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
                            {job.description}
                        </div>
                    )}

                    {/* Cost */}
                    {(job.cost || job.amount) ? (
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                            <span className="text-emerald-200/70 text-sm font-medium">{t('dashboard.totalCost')}</span>
                            <span className="text-xl font-bold text-emerald-400">
                                ฿ {(job.cost || job.amount || 0).toLocaleString()}
                            </span>
                        </div>
                    ) : null}

                    {/* Actions */}
                    <div className="flex justify-end pt-4 border-t border-slate-700/50 gap-2">
                        <Button variant="outline" className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white rounded-xl" onClick={() => { onClose(); onEdit(job); }}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            {t('common.edit')}
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl" onClick={onClose}>
                            {t('common.done')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
