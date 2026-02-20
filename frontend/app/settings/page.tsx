"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Database, Save, Sparkles, Users, Loader2, Eye, EyeOff, Shield, Globe, Languages, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { jobService } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/LanguageProvider";

export default function SettingsPage() {
    const { t, language, setLanguage } = useLanguage();
    const [config, setConfig] = useState({
        geminiApiKey: '',
        googleSheetId: '',
        googleSheetIdJobs: '',
        googleDriveFolderId: '',
        googleDriveFolderIdJobs: '',
        serviceAccountJson: '',
        users: '',
        googleAppsScriptUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showServiceAccount, setShowServiceAccount] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await jobService.getConfig();
                const fetchedConfig = response.data;
                let usersStr = '';
                if (Array.isArray(fetchedConfig.users)) {
                    usersStr = fetchedConfig.users.join(', ');
                }
                setConfig({ ...fetchedConfig, users: usersStr });
            } catch (error) {
                console.error("Failed to load config", error);
                toast.error(t('settings.loadFailed'));
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const usersArray = config.users.split(',').map(u => u.trim()).filter(u => u.length > 0);
            await jobService.saveConfig({ ...config, users: usersArray });
            toast.success(t('settings.toastSaved'));
        } catch (error) {
            console.error("Failed to save config", error);
            toast.error(t('settings.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const isMasked = (val: string) => val === '********';

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center space-y-2"
            >
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    {t('settings.title')}
                </h1>
                <p className="text-slate-400 text-sm">{t('settings.subtitle')}</p>
            </motion.div>

            <div className="space-y-5">

                {/* Language Switcher */}
                <Card className="p-5 border-slate-700/50 bg-slate-800/40 backdrop-blur-sm rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                            <Languages className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h2 className="font-semibold text-white text-sm">{t('common.language')}</h2>
                            <p className="text-xs text-slate-400">{t('settings.languageDesc')}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setLanguage('en')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${language === 'en' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-slate-800/60 text-slate-400 border border-slate-700/30 hover:bg-slate-700/40'}`}
                        >
                            🇺🇸 English
                        </button>
                        <button
                            onClick={() => setLanguage('th')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${language === 'th' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-slate-800/60 text-slate-400 border border-slate-700/30 hover:bg-slate-700/40'}`}
                        >
                            🇹🇭 ภาษาไทย
                        </button>
                    </div>
                </Card>

                {/* Team Members */}
                <Card className="p-5 border-slate-700/50 bg-slate-800/40 backdrop-blur-sm rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white text-sm">{t('settings.teamMembers')}</h2>
                            <p className="text-xs text-slate-400">{t('settings.teamMembersDesc')}</p>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="users" className="text-xs text-slate-400">{t('settings.namesLabel')}</Label>
                        <Textarea
                            id="users"
                            name="users"
                            value={config.users}
                            onChange={handleChange}
                            placeholder="Alice, Bob, Charlie"
                            className="bg-slate-900/60 border-slate-600/50 text-white font-mono text-sm min-h-[70px] rounded-xl placeholder:text-slate-600"
                        />
                        <p className="text-[11px] text-slate-500">{t('settings.namesDesc')}</p>
                    </div>
                </Card>

                {/* AI Configuration */}
                <Card className="p-5 border-slate-700/50 bg-slate-800/40 backdrop-blur-sm rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white text-sm">{t('settings.aiConfig')}</h2>
                            <p className="text-xs text-slate-400">{t('settings.aiConfigDesc')}</p>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="geminiApiKey" className="text-xs text-slate-400">Gemini API Key</Label>
                        <div className="relative">
                            <Input
                                id="geminiApiKey"
                                name="geminiApiKey"
                                type={showApiKey ? "text" : "password"}
                                value={config.geminiApiKey}
                                onChange={handleChange}
                                placeholder={isMasked(config.geminiApiKey) ? t('settings.alreadySet') : "AIza..."}
                                className="bg-slate-900/60 border-slate-600/50 text-white font-mono text-sm pr-10 rounded-xl placeholder:text-slate-600"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {isMasked(config.geminiApiKey) && (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/70">
                                <Shield className="w-3 h-3" />
                                {t('settings.secureNote')}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Google Integration */}
                <Card className="p-5 border-slate-700/50 bg-slate-800/40 backdrop-blur-sm rounded-2xl space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white text-sm">{t('settings.googleConfig')}</h2>
                            <p className="text-xs text-slate-400">{t('settings.googleConfigDesc')}</p>
                        </div>
                    </div>

                    {/* Active: Job Summary IDs */}
                    <div className="space-y-4 p-4 bg-slate-900/40 rounded-xl border border-slate-700/30">
                        <div className="flex items-center gap-2 text-xs font-medium text-indigo-300">
                            <Globe className="w-3.5 h-3.5" />
                            {t('settings.activeConfig')}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="googleSheetIdJobs" className="text-xs text-slate-400">{t('settings.sheetIdJobs')}</Label>
                            <Input
                                id="googleSheetIdJobs"
                                name="googleSheetIdJobs"
                                value={config.googleSheetIdJobs}
                                onChange={handleChange}
                                placeholder="1KuXTEbn..."
                                className="bg-slate-900/60 border-indigo-500/20 text-white font-mono text-sm rounded-xl placeholder:text-slate-600 focus-visible:ring-indigo-500/30"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="googleDriveFolderIdJobs" className="text-xs text-slate-400">{t('settings.driveFolderJobs')}</Label>
                            <Input
                                id="googleDriveFolderIdJobs"
                                name="googleDriveFolderIdJobs"
                                value={config.googleDriveFolderIdJobs}
                                onChange={handleChange}
                                placeholder="1BTlI-Zg..."
                                className="bg-slate-900/60 border-indigo-500/20 text-white font-mono text-sm rounded-xl placeholder:text-slate-600 focus-visible:ring-indigo-500/30"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="googleAppsScriptUrl" className="text-xs text-slate-400">{t('settings.appsScriptUrl')}</Label>
                            <Input
                                id="googleAppsScriptUrl"
                                name="googleAppsScriptUrl"
                                value={config.googleAppsScriptUrl}
                                onChange={handleChange}
                                placeholder="https://script.google.com/macros/s/.../exec"
                                className="bg-slate-900/60 border-emerald-500/20 text-white font-mono text-sm rounded-xl placeholder:text-slate-600 focus-visible:ring-emerald-500/30"
                            />
                            <p className="text-[11px] text-slate-500">{t('settings.appsScriptDesc')}</p>
                        </div>
                    </div>

                    {/* Legacy: ClearBill IDs */}
                    <details className="group">
                        <summary className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {t('settings.legacyConfig')}
                        </summary>
                        <div className="mt-3 space-y-3 p-3 bg-slate-900/30 rounded-xl border border-slate-700/20">
                            <div className="space-y-1.5">
                                <Label htmlFor="googleSheetId" className="text-xs text-slate-500">{t('settings.sheetIdLegacy')}</Label>
                                <Input
                                    id="googleSheetId"
                                    name="googleSheetId"
                                    value={config.googleSheetId}
                                    onChange={handleChange}
                                    className="bg-slate-900/40 border-slate-700/30 text-slate-400 font-mono text-sm rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="googleDriveFolderId" className="text-xs text-slate-500">{t('settings.driveFolderLegacy')}</Label>
                                <Input
                                    id="googleDriveFolderId"
                                    name="googleDriveFolderId"
                                    value={config.googleDriveFolderId}
                                    onChange={handleChange}
                                    className="bg-slate-900/40 border-slate-700/30 text-slate-400 font-mono text-sm rounded-xl"
                                />
                            </div>
                        </div>
                    </details>

                    {/* Service Account JSON */}
                    <div className="space-y-1.5">
                        <Label htmlFor="serviceAccountJson" className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-amber-400" />
                            {t('settings.serviceAccountJson')}
                        </Label>
                        <div className="relative">
                            <Textarea
                                id="serviceAccountJson"
                                name="serviceAccountJson"
                                value={showServiceAccount ? config.serviceAccountJson : (isMasked(config.serviceAccountJson) ? '••••••••••••••••' : config.serviceAccountJson)}
                                onChange={handleChange}
                                placeholder="{ ... }"
                                readOnly={!showServiceAccount && isMasked(config.serviceAccountJson)}
                                className="bg-slate-900/60 border-amber-500/20 text-white font-mono text-sm min-h-[80px] rounded-xl placeholder:text-slate-600"
                            />
                            <button
                                type="button"
                                onClick={() => setShowServiceAccount(!showServiceAccount)}
                                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showServiceAccount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {isMasked(config.serviceAccountJson) && (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/70">
                                <Shield className="w-3 h-3" />
                                {t('settings.secureNote')}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-indigo-500/20"
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {t('settings.saving')}
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" />
                            {t('settings.saveChanges')}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
