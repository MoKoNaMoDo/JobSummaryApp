"use client";

import { use } from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Upload, X, Loader2, User, Activity, FileText, Plus, Trash2, Camera, Send } from "lucide-react";
import { toast } from "sonner";
import { jobService } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { useLanguage } from "@/components/LanguageProvider";

// Single job entry type
interface JobEntry {
    id: string;
    taskName: string;
    note: string;
    assignee: string;
    status: "Pending" | "In Progress" | "Completed";
    file: File | null;
    preview: string | null;
    isSubmitting: boolean;
    isSubmitted: boolean;
}

const createEmptyEntry = (): JobEntry => ({
    id: crypto.randomUUID(),
    taskName: "",
    note: "",
    assignee: "",
    status: "Pending",
    file: null,
    preview: null,
    isSubmitting: false,
    isSubmitted: false,
});

export default function AddJobPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const { t } = useLanguage();
    const [entries, setEntries] = useState<JobEntry[]>([createEmptyEntry()]);
    const [users, setUsers] = useState<string[]>([]);
    const [isSubmittingAll, setIsSubmittingAll] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await jobService.getConfig();
                if (res.data?.users) {
                    setUsers(res.data.users);
                }
            } catch (e) {
                console.error("Failed to load users", e);
            }
        };
        fetchUsers();
    }, []);

    const updateEntry = useCallback((id: string, updates: Partial<JobEntry>) => {
        setEntries(prev => prev.map(entry =>
            entry.id === id ? { ...entry, ...updates } : entry
        ));
    }, []);

    const addEntry = () => {
        setEntries(prev => [...prev, createEmptyEntry()]);
    };

    const removeEntry = (id: string) => {
        if (entries.length <= 1) return;
        setEntries(prev => prev.filter(e => e.id !== id));
    };

    const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const objectUrl = URL.createObjectURL(selectedFile);
            updateEntry(id, { file: selectedFile, preview: objectUrl });
        }
    };

    const clearFile = (id: string) => {
        updateEntry(id, { file: null, preview: null });
    };

    const submitEntry = async (entry: JobEntry): Promise<boolean> => {
        if (!entry.file && entry.note.length < 5) {
            toast.error(t('addJob.validationImageOrNote'));
            return false;
        }

        updateEntry(entry.id, { isSubmitting: true });

        try {
            const formData = new FormData();
            if (entry.taskName) formData.append("taskName", entry.taskName);
            formData.append("note", entry.note);
            if (entry.assignee) formData.append("assignee", entry.assignee);
            if (entry.status) formData.append("status", entry.status);
            if (entry.file) formData.append("image", entry.file);
            formData.append("projectSlug", slug);

            await jobService.submitJob(formData);
            updateEntry(entry.id, { isSubmitting: false, isSubmitted: true });
            return true;
        } catch (error: unknown) {
            updateEntry(entry.id, { isSubmitting: false });
            console.error(error);
            toast.error(t('addJob.toastError'), {
                description: (error as Record<string, Record<string, Record<string, string>>>)?.response?.data?.message || "Something went wrong.",
            });
            return false;
        }
    };

    const submitAll = async () => {
        const pendingEntries = entries.filter(e => !e.isSubmitted);
        if (pendingEntries.length === 0) return;

        setIsSubmittingAll(true);
        let successCount = 0;

        for (const entry of pendingEntries) {
            const ok = await submitEntry(entry);
            if (ok) successCount++;
        }

        setIsSubmittingAll(false);

        if (successCount > 0) {
            toast.success(`${successCount} ${t('addJob.jobsSaved')}`);
            // Remove submitted entries and add a fresh one
            setEntries(prev => {
                const remaining = prev.filter(e => !e.isSubmitted);
                return remaining.length === 0 ? [createEmptyEntry()] : remaining;
            });
        }
    };

    const pendingCount = entries.filter(e => !e.isSubmitted).length;

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-24">
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center space-y-2"
            >
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    {t('addJob.title')}
                </h1>
                <p className="text-slate-400 text-sm">
                    {t('addJob.subtitle')}
                </p>
            </motion.div>

            {/* Entry Cards */}
            <AnimatePresence mode="popLayout">
                {entries.map((entry, index) => (
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
                        {/* Card Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/30">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center">
                                    {index + 1}
                                </span>
                                <span className="text-sm font-medium text-slate-300">
                                    {entry.taskName || t('dashboard.untitled')}
                                </span>
                                {entry.isSubmitted && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">✓ {t('addJob.saved')}</span>
                                )}
                            </div>
                            {entries.length > 1 && !entry.isSubmitted && (
                                <button
                                    onClick={() => removeEntry(entry.id)}
                                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {!entry.isSubmitted && (
                            <div className="p-5 space-y-4">
                                {/* Image Upload */}
                                <div>
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
                                                    onChange={(e) => handleFileChange(entry.id, e)}
                                                />
                                                <div className="flex items-center justify-center gap-3 text-slate-400">
                                                    <Camera className="w-5 h-5" />
                                                    <span className="text-sm">{t('addJob.clickToUpload')}</span>
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
                                                <img
                                                    src={entry.preview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => clearFile(entry.id)}
                                                        type="button"
                                                        className="rounded-full w-8 h-8"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Task Name */}
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                        <FileText className="w-3.5 h-3.5" /> {t('addJob.taskName')}
                                    </label>
                                    <Input
                                        placeholder={t('addJob.placeholderTaskName')}
                                        value={entry.taskName}
                                        onChange={(e) => updateEntry(entry.id, { taskName: e.target.value })}
                                        className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-500 rounded-xl h-10"
                                    />
                                </div>

                                {/* Assignee + Status Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                            <User className="w-3.5 h-3.5" /> {t('addJob.assignee')}
                                        </label>
                                        <div className="relative">
                                            <Input
                                                list={`assignee-list-${entry.id}`}
                                                placeholder={t('addJob.selectUser')}
                                                value={entry.assignee}
                                                onChange={(e) => updateEntry(entry.id, { assignee: e.target.value })}
                                                className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-500 rounded-xl h-10"
                                            />
                                            <datalist id={`assignee-list-${entry.id}`}>
                                                {users.map((user) => (
                                                    <option key={user} value={user} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                            <Activity className="w-3.5 h-3.5" /> {t('addJob.status')}
                                        </label>
                                        <Select
                                            value={entry.status}
                                            onValueChange={(v) => updateEntry(entry.id, { status: v as JobEntry["status"] })}
                                        >
                                            <SelectTrigger className="bg-slate-800/60 border-slate-600/50 text-white rounded-xl h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white rounded-xl">
                                                <SelectItem value="Pending">{t('status.Pending')}</SelectItem>
                                                <SelectItem value="In Progress">{t('status.In Progress')}</SelectItem>
                                                <SelectItem value="Completed">{t('status.Completed')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">{t('addJob.workDescription')}</label>
                                    <Textarea
                                        placeholder={t('addJob.placeholderDescription')}
                                        value={entry.note}
                                        onChange={(e) => updateEntry(entry.id, { note: e.target.value })}
                                        className="min-h-[80px] bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-500 resize-none rounded-xl"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submitting overlay */}
                        {entry.isSubmitting && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                                <div className="flex items-center gap-3 text-blue-300">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-sm font-medium">{t('addJob.analyzingButton')}</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Add More Button */}
            <motion.button
                onClick={addEntry}
                className="w-full py-3 border-2 border-dashed border-slate-600/40 rounded-2xl text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                <Plus className="w-4 h-4" />
                {t('addJob.addAnother') || 'Add another entry'}
            </motion.button>

            {/* Sticky Submit Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-700/50 z-50">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                        <span className="text-white font-semibold">{pendingCount}</span> {pendingCount === 1 ? t('addJob.entry') : t('addJob.entries')} {t('addJob.pendingLabel')}
                    </div>
                    <Button
                        onClick={submitAll}
                        disabled={isSubmittingAll || pendingCount === 0}
                        className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl px-6 h-10 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmittingAll ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('addJob.analyzingButton')}
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                {t('addJob.analyzeButton')} ({pendingCount})
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
