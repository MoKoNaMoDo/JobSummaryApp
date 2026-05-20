"use client";

import { motion } from "framer-motion";
import { Languages } from "lucide-react";

interface AddJobHeaderProps {
    t: (key: string) => string;
    aiLang?: "th" | "en";
    onToggleLang?: () => void;
}

export default function AddJobHeader({ t, aiLang, onToggleLang }: AddJobHeaderProps) {
    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center space-y-2"
        >
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                {t("addJob.title")}
            </h1>
            <p className="text-slate-400 text-sm">{t("addJob.subtitle")}</p>
            {aiLang && onToggleLang && (
                <button
                    onClick={onToggleLang}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all mt-1"
                    style={aiLang === "th"
                        ? { background: "rgba(99,102,241,0.12)", borderColor: "rgba(99,102,241,0.3)", color: "#a5b4fc" }
                        : { background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.3)", color: "#6ee7b7" }}
                >
                    <Languages className="w-3 h-3" />
                    AI: {aiLang === "th" ? "ภาษาไทย" : "English"}
                </button>
            )}
        </motion.div>
    );
}

