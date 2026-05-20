"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/LanguageProvider";

const COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6'
];

interface CreateProjectDialogProps {
    open: boolean;
    onClose: () => void;
    onCreate: (name: string, color: string) => Promise<void>;
}

export default function CreateProjectDialog({ open, onClose, onCreate }: CreateProjectDialogProps) {
    const { t } = useLanguage();
    const [name, setName] = useState("");
    const [color, setColor] = useState(COLORS[0]);
    const [saving, setSaving] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            await onCreate(name.trim(), color);
            setName("");
            setColor(COLORS[0]);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[420px] bg-slate-900 border-white/10 text-white rounded-2xl">
                <DialogHeader>
                    <DialogTitle>{t('projects.createTitle')}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {t('projects.createDesc')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label className="text-slate-300">{t('projects.name')}</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('projects.namePlaceholder')}
                            className="bg-black/40 border-white/10 rounded-xl text-white"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">{t('projects.color')}</Label>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-110' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" className="rounded-xl hover:bg-white/5" onClick={onClose}>{t('common.cancel')}</Button>
                    <Button onClick={handleCreate} disabled={saving || !name.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl min-w-[100px]">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />{t('common.create')}</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
