"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FolderKanban, PlusCircle, Settings } from "lucide-react";

import { useLanguage } from "@/components/LanguageProvider";

const navItems = [
    { href: "/", label: "projects.hubTitle", icon: FolderKanban },
    { href: "/settings", label: "common.settings", icon: Settings },
];

export function Navbar() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Determine active state - project pages are under "/"
    const getIsActive = (href: string) => {
        if (href === "/") return pathname === "/" || pathname.startsWith("/projects");
        return pathname === href;
    };

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 p-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl shadow-primary/20">
                {navItems.map((item) => {
                    const isActive = getIsActive(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 group",
                                isActive
                                    ? "text-primary-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary rounded-full"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            <span className="relative z-10 flex items-center gap-2">
                                <Icon className={cn("w-5 h-5", isActive && "text-white")} />
                                {isActive && mounted && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="whitespace-nowrap overflow-hidden"
                                    >
                                        {t(item.label)}
                                    </motion.span>
                                )}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
