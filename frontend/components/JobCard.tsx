"use client";

import { motion } from "framer-motion";
import { User, Calendar, MoreVertical, Edit2, Trash2, Camera } from "lucide-react";
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
}

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function JobCard({ job, t, getDriveImageUrl, onView, onEdit, onDelete, onStatusChange }: JobCardProps) {
    const imageUrl = getDriveImageUrl(job.imageUrl || job.slipUrl);

    return (
        <motion.div initial="hidden" animate="show" variants={item} transition={{ duration: 0.3 }}>
            <Card
                className="overflow-hidden border border-slate-700/30 bg-slate-800/60 shadow-sm hover:shadow-lg hover:bg-slate-800/80 transition-all cursor-pointer group flex flex-col rounded-xl relative"
                onClick={() => onView(job)}
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
                                {ALL_STATUSES.map(s => {
                                    const colors = getStatusColors(s);
                                    return (
                                        <DropdownMenuItem key={s} className="focus:bg-white/10 cursor-pointer" onClick={(e) => { e.stopPropagation(); onStatusChange(job, s); }}>
                                            <span className={`w-2 h-2 rounded-full ${colors.dot} mr-2`} /> {t(`dashboard.mark${s === 'In Progress' ? 'InProgress' : s === 'Pending' ? 'Pending' : 'Completed'}`)}
                                        </DropdownMenuItem>
                                    );
                                })}
                                <div className="h-px bg-slate-600/50 my-1" />
                                <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={(e) => { e.stopPropagation(); onEdit(job); }}>
                                    <Edit2 className="w-4 h-4 mr-2" /> {t('common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer" onClick={(e) => { e.stopPropagation(); onDelete(job); }}>
                                    <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                {imageUrl && (
                    <div className="mx-4 mt-1 h-28 rounded-lg overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                        <div className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-1">
                            <Camera className="w-3 h-3 text-white/80" />
                        </div>
                    </div>
                )}

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
                        <div className="flex items-center gap-3">
                            {job.description && (
                                <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[8px] text-indigo-300 font-bold" title="Has notes">
                                    N
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
    );
}

export type { Job };
