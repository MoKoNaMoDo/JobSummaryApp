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
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-700/50 z-50">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                    <span className="text-white font-semibold">{pendingCount}</span>{" "}
                    {pendingCount === 1 ? t("addJob.entry") : t("addJob.entries")} {t("addJob.pendingLabel")}
                </div>
                <Button
                    onClick={onSubmitAll}
                    disabled={isSubmittingAll || pendingCount === 0}
                    className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl px-6 h-10 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmittingAll ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("addJob.analyzingButton")}
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            {t("addJob.analyzeButton")} ({pendingCount})
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

