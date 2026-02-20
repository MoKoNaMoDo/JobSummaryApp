"use client";

import { useLanguage } from "./LanguageProvider";
import { Button } from "./ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

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
