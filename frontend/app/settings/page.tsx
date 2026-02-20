"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Database, Key, Save, Sparkles, User, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { jobService } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/LanguageProvider";

export default function SettingsPage() {
    const { t } = useLanguage();
    const [config, setConfig] = useState({
        geminiApiKey: '',
        googleSheetId: '',
        googleSheetIdJobs: '',
        googleDriveFolderId: '',
        googleDriveFolderIdJobs: '',
        serviceAccountJson: '',
        users: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await jobService.getConfig();
                const fetchedConfig = response.data;

                // Convert users array back to comma-separated string for display
                let usersStr = '';
                if (Array.isArray(fetchedConfig.users)) {
                    usersStr = fetchedConfig.users.join(', ');
                }

                setConfig({
                    ...fetchedConfig,
                    users: usersStr
                });
            } catch (error) {
                console.error("Failed to load config", error);
                toast.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Convert users string to array
            const usersArray = config.users.split(',').map(u => u.trim()).filter(u => u.length > 0);

            await jobService.saveConfig({
                ...config,
                users: usersArray
            });
            toast.success(t('settings.toastSaved'));
        } catch (error) {
            console.error("Failed to save config", error);
            toast.error("Failed to save settings");
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

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center space-y-2"
            >
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    {t('settings.title')}
                </h1>
                <p className="text-muted-foreground">
                    {t('settings.subtitle')}
                </p>
            </motion.div>

            <div className="space-y-6">

                {/* Team Members Section */}
                <Card className="p-6 border-white/5 bg-white/5 backdrop-blur-xl space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold">{t('settings.teamMembers')}</h2>
                            <p className="text-sm text-muted-foreground">{t('settings.teamMembersDesc')}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="users">{t('settings.namesLabel')}</Label>
                        <Textarea
                            id="users"
                            name="users"
                            value={config.users}
                            onChange={handleChange}
                            placeholder="Alice, Bob, Charlie"
                            className="bg-black/20 font-mono text-sm min-h-[80px]"
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('settings.namesDesc')}
                        </p>
                    </div>
                </Card>

                {/* AI Configuration */}
                <Card className="p-6 border-white/5 bg-white/5 backdrop-blur-xl space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold">{t('settings.aiConfig')}</h2>
                            <p className="text-sm text-muted-foreground">{t('settings.aiConfigDesc')}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="geminiApiKey">Gemini API Key</Label>
                        <Input
                            id="geminiApiKey"
                            name="geminiApiKey"
                            type="password"
                            value={config.geminiApiKey}
                            onChange={handleChange}
                            placeholder="AIza..."
                            className="bg-black/20 font-mono text-sm"
                        />
                    </div>
                </Card>

                {/* Google Configuration */}
                <Card className="p-6 border-white/5 bg-white/5 backdrop-blur-xl space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold">{t('settings.googleConfig')}</h2>
                            <p className="text-sm text-muted-foreground">{t('settings.googleConfigDesc')}</p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="googleSheetId">ClearBill Sheet ID (Legacy)</Label>
                            <Input
                                id="googleSheetId"
                                name="googleSheetId"
                                value={config.googleSheetId}
                                onChange={handleChange}
                                className="bg-black/20 font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="googleSheetIdJobs">Job Summary Sheet ID</Label>
                            <Input
                                id="googleSheetIdJobs"
                                name="googleSheetIdJobs"
                                value={config.googleSheetIdJobs}
                                onChange={handleChange}
                                placeholder="1KuXTEbn..."
                                className="bg-black/20 font-mono text-sm border-blue-500/30 focus-visible:ring-blue-500"
                            />
                            <p className="text-xs text-muted-foreground mt-1">This is the separate sheet exclusively for daily work logs.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="googleDriveFolderId">ClearBill Image Folder ID (Legacy)</Label>
                            <Input
                                id="googleDriveFolderId"
                                name="googleDriveFolderId"
                                value={config.googleDriveFolderId}
                                onChange={handleChange}
                                className="bg-black/20 font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="googleDriveFolderIdJobs">Job Summary Image Folder ID</Label>
                            <Input
                                id="googleDriveFolderIdJobs"
                                name="googleDriveFolderIdJobs"
                                value={config.googleDriveFolderIdJobs}
                                onChange={handleChange}
                                placeholder="1BTlI-Zg..."
                                className="bg-black/20 font-mono text-sm border-purple-500/30 focus-visible:ring-purple-500"
                            />
                            <p className="text-xs text-muted-foreground mt-1">This folder will exclusively store images attached to daily work logs.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="serviceAccountJson">Service Account JSON</Label>
                            <Textarea
                                id="serviceAccountJson"
                                name="serviceAccountJson"
                                value={config.serviceAccountJson}
                                onChange={handleChange}
                                placeholder="{ ... }"
                                className="bg-black/20 font-mono text-sm min-h-[100px]"
                            />
                        </div>
                    </div>
                </Card>

                <Button
                    onClick={handleSave}
                    className="w-full h-12 text-lg font-medium"
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Saving...
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
