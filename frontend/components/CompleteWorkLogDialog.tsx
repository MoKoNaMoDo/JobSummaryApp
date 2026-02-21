"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, Plus, Activity, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { jobService } from "@/lib/api";
import type { Job } from "./JobCard";

interface CompleteWorkLogDialogProps {
    job: Job | null;
    open: boolean;
    t: (key: string) => string;
    onComplete: (job: Job, workLog: string) => void;
    onClose: () => void;
}

const AI_MODES = [
    { mode: 'refine' as const, label: '✨ Refine', },
    { mode: 'expand' as const, label: '+ Expand' },
    { mode: 'organize' as const, label: '⚡ Organize' },
    { mode: 'shorten' as const, label: '✂️ สั้นลง' },
];

export default function CompleteWorkLogDialog({ job, open, t, onComplete, onClose }: CompleteWorkLogDialogProps) {
    const [workLog, setWorkLog] = useState("");
    const [refining, setRefining] = useState(false);
    const [saving, setSaving] = useState(false);
    const [aiLang, setAiLang] = useState<'th' | 'en'>('th');

    useEffect(() => {
        const saved = localStorage.getItem('ai_lang') as 'th' | 'en' | null;
        if (saved) setAiLang(saved);
        // Pre-fill with existing description if available
        if (job?.description) setWorkLog(job.description);
        else setWorkLog("");
    }, [job]);

    const handleRefine = async (mode: 'refine' | 'expand' | 'organize' | 'shorten') => {
        if (!workLog || workLog.length < 5) {
            toast.error('กรุณากรอกรายละเอียดงานก่อนใช้ AI');
            return;
        }
        setRefining(true);
        try {
            const res = await jobService.refineText(workLog, mode, aiLang);
            if (res.status === 'success') {
                setWorkLog(res.data);
                toast.success('AI ปรับแต่งเสร็จแล้ว ✨');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'AI ไม่สามารถปรับแต่งได้');
        } finally {
            setRefining(false);
        }
    };

    const handleSave = async () => {
        if (!job) return;
        setSaving(true);
        try {
            onComplete(job, workLog);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="w-[95vw] sm:max-w-[520px] bg-slate-900 border-white/10 text-white rounded-2xl p-0 flex flex-col max-h-[90vh]">
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        บันทึกงานที่เสร็จสิ้น
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        เขียนสรุปงานที่ทำเสร็จ แล้วระบบจะเปลี่ยนสถานะเป็น Completed อัตโนมัติ
                    </DialogDescription>
                </DialogHeader>

                {job && (
                    <div className="space-y-4 px-6 py-2 overflow-y-auto flex-1">
                        {/* Job Info Summary */}
                        <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 px-4 py-3 space-y-1">
                            <p className="text-sm font-semibold text-white">{job.taskName || job.category || t('dashboard.untitled')}</p>
                            <p className="text-xs text-slate-400">{job.assignee && `👤 ${job.assignee} · `}📅 {job.date}</p>
                        </div>

                        {/* Work Log + AI Toolbar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-slate-400">สรุปงานที่ทำ</label>
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
                                    {AI_MODES.map(btn => (
                                        <Button
                                            key={btn.mode}
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRefine(btn.mode)}
                                            disabled={refining || !workLog}
                                            className="h-6 px-2 text-[10px] bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-300 border border-indigo-500/10 rounded-lg"
                                        >
                                            {refining ? <Loader2 className="w-3 h-3 animate-spin" /> : btn.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <Textarea
                                value={workLog}
                                onChange={(e) => setWorkLog(e.target.value)}
                                className="bg-black/40 border-white/10 resize-none rounded-xl min-h-[120px]"
                                placeholder={aiLang === 'th'
                                    ? "เช่น: แก้ไขระบบ login โดยปรับ token persistent ใน localStorage แล้วทดสอบจนผ่าน..."
                                    : "e.g. Fixed login session by persisting token in localStorage, tested and passed..."}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter className="px-6 py-4 gap-2 border-t border-white/5 shrink-0">
                    <Button variant="ghost" className="rounded-xl hover:bg-white/5" onClick={onClose}>
                        ยกเลิก
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        บันทึกและ Complete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
