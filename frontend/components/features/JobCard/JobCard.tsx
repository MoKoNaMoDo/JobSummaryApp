"use client";

import { motion } from "framer-motion";
import { User, Calendar, MoreVertical, Edit2, Trash2, Camera, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getStatusColors, ALL_STATUSES } from "@/lib/statusColors";

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

interface JobCardProps {
    job: Job;
    t: (key: string) => string;
    getDriveImageUrl: (url: string | undefined) => string;
    onView: (job: Job) => void;
    onEdit: (job: Job) => void;
    onDelete: (job: Job) => void;
    onStatusChange: (job: Job, status: string) => void;
    onComplete?: (job: Job) => void;
}

const statusBorderColor: Record<string, string> = {
    'Pending':     'rgba(251,191,36,0.50)',
    'In Progress': 'rgba(96,165,250,0.50)',
    'Completed':   'rgba(52,211,153,0.50)',
};

const item = {
    hidden: { y: 12, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function JobCard({ job, t, getDriveImageUrl, onView, onEdit, onDelete, onStatusChange, onComplete }: JobCardProps) {
    const imageUrl = getDriveImageUrl(job.imageUrl || job.slipUrl);
    const colors = getStatusColors(job.status);
    const borderColor = statusBorderColor[job.status] || statusBorderColor['Pending'];

    return (
        <motion.div initial="hidden" animate="show" variants={item} transition={{ duration: 0.25 }}>
            <Card
                className="overflow-hidden border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col rounded-xl relative"
                style={{ borderLeftColor: borderColor, borderLeftWidth: '2px' }}
                onClick={() => onView(job)}
            >
                <CardHeader className="p-3 pb-2 flex flex-row justify-between items-start gap-2 space-y-0">
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <h4 className="font-semibold text-white/90 line-clamp-2 text-sm leading-snug">
                            {job.taskName || job.category || t('dashboard.untitled')}
                        </h4>
                        {/* Inline status + assignee */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${colors.bg} ${colors.text} border-current/20`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                {job.status}
                            </span>
                            {job.assignee && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                                    <User className="w-2.5 h-2.5" />
                                    {job.assignee}
                                </span>
                            )}
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 hover:bg-white/10 text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white shadow-xl rounded-xl">
                            {ALL_STATUSES.map(s => {
                                const sc = getStatusColors(s);
                                return (
                                    <DropdownMenuItem
                                        key={s}
                                        className="focus:bg-white/10 cursor-pointer text-sm"
                                        onClick={(e) => { e.stopPropagation(); onStatusChange(job, s); }}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${sc.dot} mr-2`} />
                                        {t(`dashboard.mark${s === 'In Progress' ? 'InProgress' : s === 'Pending' ? 'Pending' : 'Completed'}`)}
                                    </DropdownMenuItem>
                                );
                            })}
                            <div className="h-px bg-white/5 my-1" />
                            <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-sm" onClick={(e) => { e.stopPropagation(); onEdit(job); }}>
                                <Edit2 className="w-3.5 h-3.5 mr-2" /> {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer text-sm"
                                onClick={(e) => { e.stopPropagation(); onDelete(job); }}
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> {t('common.delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>

                {imageUrl && (
                    <div className="mx-3 mt-0.5 h-24 rounded-lg overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                        />
                        <div className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-1">
                            <Camera className="w-2.5 h-2.5 text-white/70" />
                        </div>
                    </div>
                )}

                <CardContent className="p-3 pt-2 flex-grow space-y-2">
                    {/* Footer: date + note indicator */}
                    <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1.5 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{job.date.split('-').reverse().slice(0, 2).join('/')}</span>
                        </div>
                        {job.description && (
                            <span className="text-slate-700 text-[10px]">มีหมายเหตุ</span>
                        )}
                    </div>

                    {/* Complete button */}
                    {job.status !== 'Completed' && onComplete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onComplete(job); }}
                            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-400/50 hover:text-emerald-300 bg-white/[0.02] hover:bg-emerald-500/10 border border-white/[0.05] hover:border-emerald-500/20 rounded-lg py-1.5 transition-all duration-200"
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            {t('dashboard.markCompleted') || 'Mark complete'}
                        </button>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

export type { Job };
