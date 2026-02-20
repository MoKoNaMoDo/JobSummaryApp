"use client";

import { DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function EditJobDialog({ job, open, users, saving, t, onJobChange, onSave, onClose }: EditJobDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white rounded-2xl">
                <DialogHeader>
                    <DialogTitle>{t('dashboard.editTitle')}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {t('dashboard.editDescription')}
                    </DialogDescription>
                </DialogHeader>
                {job && (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="taskName" className="text-right text-slate-300">{t('dashboard.fieldTask')}</Label>
                            <Input
                                id="taskName"
                                value={job.taskName || job.category || ""}
                                onChange={(e) => onJobChange({ ...job, taskName: e.target.value })}
                                className="col-span-3 bg-black/40 border-white/10 rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right text-slate-300">{t('dashboard.fieldDate')}</Label>
                            <Input
                                id="date"
                                type="date"
                                value={job.date}
                                onChange={(e) => onJobChange({ ...job, date: e.target.value })}
                                className="col-span-3 bg-black/40 border-white/10 rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="assignee-edit" className="text-right text-slate-300">{t('dashboard.fieldAssignee')}</Label>
                            <div className="col-span-3 relative">
                                <Input
                                    id="assignee-edit"
                                    list="assignee-edit-list"
                                    value={job.assignee}
                                    onChange={(e) => onJobChange({ ...job, assignee: e.target.value })}
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
                                value={job.description}
                                onChange={(e) => onJobChange({ ...job, description: e.target.value })}
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
                                    value={job.cost || job.amount || 0}
                                    onChange={(e) => onJobChange({ ...job, cost: Number(e.target.value) })}
                                    className="bg-black/40 border-white/10 rounded-xl pl-8"
                                />
                                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                    </div>
                )}
                <DialogFooter>
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
