"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DeleteJobDialogProps {
    open: boolean;
    t: (key: string) => string;
    onConfirm: () => void;
    onClose: () => void;
}

export default function DeleteJobDialog({ open, t, onConfirm, onClose }: DeleteJobDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-red-500/20 text-white rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-red-400 flex items-center gap-2">
                        <Trash2 className="w-5 h-5" /> {t('dashboard.deleteConfirmTitle')}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium">
                        {t('dashboard.deleteConfirmMsg')}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                    <Button variant="ghost" className="rounded-xl hover:bg-white/5" onClick={onClose}>{t('common.cancel')}</Button>
                    <Button variant="destructive" className="rounded-xl" onClick={onConfirm}>{t('common.delete')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
