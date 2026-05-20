"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider/LanguageProvider";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Avoid hydration mismatch — render nothing until client-side mount
    if (!mounted) return <Button variant="ghost" size="icon" className="rounded-full text-white/50 hover:text-white w-9 h-9" />;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
            title={language === 'en' ? "Switch to Thai" : "Switch to English"}
            className="rounded-full text-white/50 hover:text-white"
        >
            <div className="flex items-center gap-1 font-bold text-xs">
                {language.toUpperCase()}
            </div>
        </Button>
    );
}
