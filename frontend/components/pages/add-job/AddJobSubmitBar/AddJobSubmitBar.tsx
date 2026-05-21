"use client";

import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddJobSubmitBarProps {
    pendingCount: number;
    isSubmittingAll: boolean;
    t: (key: string) => string;
    onSubmitAll: () => void;
}

export default function AddJobSubmitBar({ pendingCount, isSubmittingAll, t, onSubmitAll }: AddJobSubmitBarProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#09090f]/80 backdrop-blur-xl border-t border-white/[0.06] z-50">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                    <span className="text-white font-semibold">{pendingCount}</span>{" "}
                    {pendingCount === 1 ? t("addJob.entry") : t("addJob.entries")} {t("addJob.pendingLabel")}
                </div>
                <Button
                    onClick={onSubmitAll}
                    disabled={isSubmittingAll || pendingCount === 0}
                    className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/30 rounded-xl px-5 h-9 shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isSubmittingAll ? (
                        <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            {t("addJob.analyzingButton")}
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-3.5 w-3.5" />
                            {t("addJob.analyzeButton")} ({pendingCount})
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
