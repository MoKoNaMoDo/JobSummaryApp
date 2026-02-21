"use client";

import { useState, useEffect } from "react";
import { DollarSign, Loader2, Sparkles, Plus, Activity, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { jobService } from "@/lib/api";
import type { Job } from "./JobCard";

interface EditJobDialogProps {
    job: Job | null;
    open: boolean;
    users: string[];
    saving: boolean;
    t: (key: string) => string;
    onJobChange: (job: Job) => void;
    onSave: () => void;
    onClose: () => void;
}

const AI_MODES = [
    { mode: 'refine' as const, label: '✨ Refine', icon: Sparkles },
    { mode: 'expand' as const, label: '+ Expand', icon: Plus },
    { mode: 'organize' as const, label: '⚡ Organize', icon: Activity },
    { mode: 'shorten' as const, label: '✂️ สั้นลง', icon: FileText },
];

export default function EditJobDialog({ job, open, users, saving, t, onJobChange, onSave, onClose }: EditJobDialogProps) {
    const [aiLang, setAiLang] = useState<'th' | 'en'>('th');
    const [refining, setRefining] = useState(false);
    const [generatingTitle, setGeneratingTitle] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('ai_lang') as 'th' | 'en' | null;
        if (saved) setAiLang(saved);
    }, []);

    const handleRefine = async (mode: 'refine' | 'expand' | 'organize' | 'shorten') => {
        if (!job?.description || job.description.length < 5) {
            toast.error('กรุณากรอกรายละเอียดงานก่อนใช้ AI');
            return;
        }
        setRefining(true);
        try {
            const res = await jobService.refineText(job.description, mode, aiLang);
            if (res.status === 'success') {
                onJobChange({ ...job, description: res.data });
                toast.success('AI ปรับแต่งเสร็จแล้ว ✨');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'AI ไม่สามารถปรับแต่งได้');
        } finally {
            setRefining(false);
        }
    };

    const handleGenerateTitle = async () => {
        if (!job?.description || job.description.length < 5) {
            toast.error('กรุณากรอกรายละเอียดงานก่อนสร้างชื่อ');
            return;
        }
        setGeneratingTitle(true);
        try {
            const res = await jobService.refineText(job.description, 'title', aiLang);
            if (res.status === 'success') {
                onJobChange({ ...job, taskName: res.data });
                toast.success('สร้างชื่องานเรียบร้อยแล้ว ✨');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'ไม่สามารถสร้างชื่องานได้');
        } finally {
            setGeneratingTitle(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[95vw] sm:max-w-[520px] bg-slate-900 border-white/10 text-white rounded-2xl p-0 flex flex-col max-h-[90vh]">
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                    <DialogTitle>{t('dashboard.editTitle')}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {t('dashboard.editDescription')}
                    </DialogDescription>
                </DialogHeader>
                {job && (
                    <div className="grid gap-4 px-6 py-2 overflow-y-auto flex-1">
                        {/* Task Name + Gen */}
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-xs">{t('dashboard.fieldTask')}</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={job.taskName || job.category || ""}
                                    onChange={(e) => onJobChange({ ...job, taskName: e.target.value })}
                                    className="bg-black/40 border-white/10 rounded-xl flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleGenerateTitle}
                                    disabled={generatingTitle || !job.description}
                                    title="สร้างชื่องานจาก AI"
                                    className="h-10 px-2.5 shrink-0 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-xl"
                                >
                                    {generatingTitle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5 mr-1" /><span className="text-[10px] font-semibold">Gen</span></>}
                                </Button>
                            </div>
                        </div>

                        {/* Date + Assignee Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-slate-300 text-xs">{t('dashboard.fieldDate')}</Label>
                                <Input
                                    type="date"
                                    value={job.date}
                                    onChange={(e) => onJobChange({ ...job, date: e.target.value })}
                                    className="bg-black/40 border-white/10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-slate-300 text-xs">{t('dashboard.fieldAssignee')}</Label>
                                <Input
                                    list="assignee-edit-list"
                                    value={job.assignee}
                                    onChange={(e) => onJobChange({ ...job, assignee: e.target.value })}
                                    className="bg-black/40 border-white/10 rounded-xl"
                                    placeholder={t('dashboard.placeholderAssignee')}
                                />
                                <datalist id="assignee-edit-list">
                                    <option value={t('dashboard.unassigned')} />
                                    {users.map(u => <option key={u} value={u} />)}
                                </datalist>
                            </div>
                        </div>

                        {/* Work Description + AI Toolbar */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-300 text-xs">{t('dashboard.fieldNotes')}</Label>
                                <div className="flex flex-wrap items-center gap-1">
                                    {/* Lang toggle */}
                                    <button
                                        onClick={() => { const n = aiLang === 'th' ? 'en' : 'th'; setAiLang(n); localStorage.setItem('ai_lang', n); }}
                                        className="text-[10px] px-2 py-0.5 rounded-full border transition-all mr-1"
                                        style={aiLang === 'th'
                                            ? { background: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }
                                            : { background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)', color: '#6ee7b7' }}
                                    >
                                        {aiLang === 'th' ? '🇹🇭 TH' : '🇬🇧 EN'}
                                    </button>
                                    {/* AI mode buttons */}
                                    {AI_MODES.map(btn => (
                                        <Button
                                            key={btn.mode}
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRefine(btn.mode)}
                                            disabled={refining || !job.description}
                                            className="h-6 px-2 text-[10px] bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-300 border border-indigo-500/10 rounded-lg"
                                        >
                                            {refining ? <Loader2 className="w-3 h-3 animate-spin" /> : btn.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <Textarea
                                value={job.description}
                                onChange={(e) => onJobChange({ ...job, description: e.target.value })}
                                className="bg-black/40 border-white/10 resize-none rounded-xl"
                                rows={4}
                                placeholder="รายละเอียดงานที่ทำ..."
                            />
                        </div>

                        {/* Cost */}
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-xs">{t('dashboard.fieldCost')}</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={job.cost || job.amount || 0}
                                    onChange={(e) => onJobChange({ ...job, cost: Number(e.target.value) })}
                                    className="bg-black/40 border-white/10 rounded-xl pl-8"
                                />
                                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                    </div>
                )}
                <DialogFooter className="px-6 py-4 border-t border-white/5 shrink-0">
                    <Button variant="ghost" className="rounded-xl hover:bg-white/5" onClick={onClose}>{t('common.cancel')}</Button>
                    <Button onClick={onSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {t('common.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
