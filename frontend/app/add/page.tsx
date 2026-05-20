"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { jobService } from "@/lib/api";
import AddJobEntryCard from "@/components/pages/add-job/AddJobEntryCard/AddJobEntryCard";
import AddJobHeader from "@/components/pages/add-job/AddJobHeader/AddJobHeader";
import AddJobSubmitBar from "@/components/pages/add-job/AddJobSubmitBar/AddJobSubmitBar";
import { useLanguage } from "@/components/features/LanguageProvider/LanguageProvider";
import { createEmptyJobEntry, type JobEntry } from "@/lib/jobs/jobEntry";

export default function AddJobPage() {
    const { t } = useLanguage();
    const [entries, setEntries] = useState<JobEntry[]>([createEmptyJobEntry()]);
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
        setEntries(prev => [...prev, createEmptyJobEntry()]);
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
                return remaining.length === 0 ? [createEmptyJobEntry()] : remaining;
            });
        }
    };

    const pendingCount = entries.filter(e => !e.isSubmitted).length;

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-24">
            <AddJobHeader t={t} />

            <AnimatePresence mode="popLayout">
                {entries.map((entry, index) => (
                    <AddJobEntryCard
                        key={entry.id}
                        entry={entry}
                        index={index}
                        totalEntries={entries.length}
                        users={users}
                        t={t}
                        onUpdate={updateEntry}
                        onRemove={removeEntry}
                        onFileChange={handleFileChange}
                        onClearFile={clearFile}
                    />
                ))}
            </AnimatePresence>

            <motion.button
                onClick={addEntry}
                className="w-full py-3 border-2 border-dashed border-slate-600/40 rounded-2xl text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                <Plus className="w-4 h-4" />
                {t('addJob.addAnother') || 'Add another entry'}
            </motion.button>

            <AddJobSubmitBar pendingCount={pendingCount} isSubmittingAll={isSubmittingAll} t={t} onSubmitAll={submitAll} />
        </div>
    );
}
