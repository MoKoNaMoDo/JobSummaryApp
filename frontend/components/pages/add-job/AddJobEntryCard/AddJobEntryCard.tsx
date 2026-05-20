"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, Calendar, Camera, FileText, Loader2, Plus, Sparkles, Trash2, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { JobEntry, JobStatus } from "@/lib/jobs/jobEntry";

type RefineMode = "refine" | "expand" | "organize" | "shorten";

interface AddJobEntryCardProps {
    entry: JobEntry;
    index: number;
    totalEntries: number;
    users: string[];
    t: (key: string) => string;
    showWorkDate?: boolean;
    aiLang?: "th" | "en";
    isRefining?: boolean;
    isGeneratingTitle?: boolean;
    onUpdate: (id: string, updates: Partial<JobEntry>) => void;
    onRemove: (id: string) => void;
    onFileChange: (id: string, event: React.ChangeEvent<HTMLInputElement>) => void;
    onClearFile: (id: string) => void;
    onRefine?: (id: string, text: string, mode: RefineMode) => void;
    onGenerateTitle?: (id: string, note: string) => void;
}

export default function AddJobEntryCard({
    entry,
    index,
    totalEntries,
    users,
    t,
    showWorkDate = false,
    aiLang = "th",
    isRefining = false,
    isGeneratingTitle = false,
    onUpdate,
    onRemove,
    onFileChange,
    onClearFile,
    onRefine,
    onGenerateTitle,
}: AddJobEntryCardProps) {
    const refineActions = [
        { mode: "refine" as const, label: t("addJob.aiRefine"), icon: Sparkles },
        { mode: "expand" as const, label: t("addJob.aiExpand"), icon: Plus },
        { mode: "organize" as const, label: t("addJob.aiOrganize"), icon: Activity },
        { mode: "shorten" as const, label: aiLang === "th" ? "สั้นลง" : "Shorten", icon: FileText },
    ];

    return (
        <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`relative rounded-2xl border transition-all ${entry.isSubmitted
                ? "border-emerald-500/30 bg-emerald-500/5"
                : entry.isSubmitting
                    ? "border-blue-500/30 bg-blue-500/5"
                    : "border-slate-700/50 bg-slate-800/40"
                } backdrop-blur-sm overflow-hidden`}
        >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/30">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-300">
                        {entry.taskName || t("dashboard.untitled")}
                    </span>
                    {entry.isSubmitted && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                            {t("addJob.saved")}
                        </span>
                    )}
                </div>
                {totalEntries > 1 && !entry.isSubmitted && (
                    <button
                        onClick={() => onRemove(entry.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {!entry.isSubmitted && (
                <div className="p-5 space-y-4">
                    <AnimatePresence mode="wait">
                        {!entry.preview ? (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="border-2 border-dashed border-slate-600/50 rounded-xl p-4 text-center hover:bg-slate-700/20 hover:border-indigo-500/30 transition-all cursor-pointer relative"
                            >
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(event) => onFileChange(entry.id, event)}
                                />
                                <div className="flex items-center justify-center gap-3 text-slate-400">
                                    <Camera className="w-5 h-5" />
                                    <span className="text-sm">{t("addJob.clickToUpload")}</span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative rounded-xl overflow-hidden h-36 group"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={entry.preview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => onClearFile(entry.id)}
                                        type="button"
                                        className="rounded-full w-8 h-8"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={showWorkDate ? "grid grid-cols-2 gap-3" : "space-y-1.5"}>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                <FileText className="w-3.5 h-3.5" /> {t("addJob.taskName")}
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                <Input
                                    placeholder={t("addJob.placeholderTaskName")}
                                    value={entry.taskName}
                                    onChange={(event) => onUpdate(entry.id, { taskName: event.target.value })}
                                    className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-500 rounded-xl h-10 flex-1"
                                />
                                {onGenerateTitle && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onGenerateTitle(entry.id, entry.note)}
                                        disabled={isGeneratingTitle || !entry.note}
                                        title="สร้างชื่องานอัตโนมัติจาก AI"
                                        className="h-10 px-2.5 shrink-0 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-xl transition-all"
                                    >
                                        {isGeneratingTitle ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles className="w-3.5 h-3.5 mr-1" />
                                                <span className="text-[10px] font-semibold">Gen</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                        {showWorkDate && (
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                    <Calendar className="w-3.5 h-3.5" /> วันที่ทำงาน
                                </label>
                                <Input
                                    type="date"
                                    value={entry.workDate || ""}
                                    onChange={(event) => onUpdate(entry.id, { workDate: event.target.value })}
                                    className="bg-slate-800/60 border-slate-600/50 text-white rounded-xl h-10"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                <User className="w-3.5 h-3.5" /> {t("addJob.assignee")}
                            </label>
                            <Input
                                list={`assignee-list-${entry.id}`}
                                placeholder={t("addJob.selectUser")}
                                value={entry.assignee}
                                onChange={(event) => onUpdate(entry.id, { assignee: event.target.value })}
                                className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-500 rounded-xl h-10"
                            />
                            <datalist id={`assignee-list-${entry.id}`}>
                                {users.map((user) => (
                                    <option key={user} value={user} />
                                ))}
                            </datalist>
                        </div>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                <Activity className="w-3.5 h-3.5" /> {t("addJob.status")}
                            </label>
                            <Select
                                value={entry.status}
                                onValueChange={(value) => onUpdate(entry.id, { status: value as JobStatus })}
                            >
                                <SelectTrigger className="bg-slate-800/60 border-slate-600/50 text-white rounded-xl h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white rounded-xl">
                                    <SelectItem value="Pending">{t("status.Pending")}</SelectItem>
                                    <SelectItem value="In Progress">{t("status.In Progress")}</SelectItem>
                                    <SelectItem value="Completed">{t("status.Completed")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-xs font-medium text-slate-400">{t("addJob.workDescription")}</label>
                            {onRefine && (
                                <div className="flex flex-wrap gap-1.5 justify-end">
                                    {refineActions.map((action) => (
                                        <Button
                                            key={action.mode}
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRefine(entry.id, entry.note, action.mode)}
                                            disabled={isRefining || !entry.note}
                                            className="h-7 px-2 text-[10px] bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-300 border border-indigo-500/10 rounded-lg transition-all"
                                        >
                                            {isRefining ? (
                                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                            ) : (
                                                <action.icon className="w-3 h-3 mr-1" />
                                            )}
                                            {action.label}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Textarea
                            placeholder={t("addJob.placeholderDescription")}
                            value={entry.note}
                            onChange={(event) => onUpdate(entry.id, { note: event.target.value })}
                            className="min-h-[80px] bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-500 resize-none rounded-xl"
                        />
                    </div>
                </div>
            )}

            {entry.isSubmitting && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                    <div className="flex items-center gap-3 text-blue-300">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">{t("addJob.analyzingButton")}</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

