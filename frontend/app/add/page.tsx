"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Upload, X, Loader2, User, Activity, FileText } from "lucide-react";
import { toast } from "sonner"; // Shadcn Sonner
import { jobService } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Schema
const formSchema = z.object({
    taskName: z.string().optional(),
    note: z.string().min(5, {
        message: "Note must be at least 5 characters.",
    }),
    assignee: z.string().optional(),
    status: z.enum(["Pending", "In Progress", "Completed"]),
});

type FormValues = z.infer<typeof formSchema>;

import { useLanguage } from "@/components/LanguageProvider";

export default function AddJobPage() {
    const { t } = useLanguage();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isanalyzing, setIsAnalyzing] = useState(false);
    const [users, setUsers] = useState<string[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            taskName: "",
            note: "",
            assignee: "",
            status: "Pending",
        },
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await jobService.getConfig();
                if (res.data?.users) {
                    setUsers(res.data.users);
                }
            } catch (e) {
                console.error("Failed to load users", e);
            }
        };
        fetchUsers();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const objectUrl = URL.createObjectURL(selectedFile);
            setPreview(objectUrl);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
    };


    async function onSubmit(values: FormValues) {
        if (!file && values.note.length < 5) {
            toast.error(t('addJob.validationImageOrNote'));
            return;
        }

        setIsAnalyzing(true);

        try {
            const formData = new FormData();
            if (values.taskName) formData.append("taskName", values.taskName);
            formData.append("note", values.note);
            if (values.assignee) formData.append("assignee", values.assignee);
            if (values.status) formData.append("status", values.status);

            if (file) {
                formData.append("image", file);
            }

            const result = await jobService.submitJob(formData);

            setIsAnalyzing(false);
            toast.success(t('addJob.toastSuccess'), {
                description: `Analyzed as: ${result.data.category} - ${result.data.taskName || 'Task'}`,
            });
            form.reset({
                taskName: "",
                note: "",
                assignee: values.assignee,
                status: "Pending"
            });
            clearFile();
        } catch (error: unknown) {
            setIsAnalyzing(false);
            console.error(error);
            toast.error(t('addJob.toastError'), {
                description: (error as Record<string, Record<string, Record<string, string>>>)?.response?.data?.message || "Something went wrong.",
            });
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center space-y-2"
            >
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    {t('addJob.title')}
                </h1>
                <p className="text-muted-foreground">
                    {t('addJob.subtitle')}
                </p>
            </motion.div>

            <Card className="p-6 border-white/5 bg-white/5 backdrop-blur-xl">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Image Upload Area */}
                        <div className="space-y-2">
                            <FormLabel>{t('addJob.imageEvidence')}</FormLabel>
                            <AnimatePresence mode="wait">
                                {!preview ? (
                                    <motion.div
                                        key="upload-zone"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer relative"
                                    >
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleFileChange}
                                        />
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <div className="p-3 bg-white/5 rounded-full">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-medium">{t('addJob.clickToUpload')}</p>
                                            <p className="text-xs text-muted-foreground/50">{t('addJob.fileType')}</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="preview-zone"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="relative rounded-xl overflow-hidden aspect-video group"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={clearFile}
                                                type="button"
                                                className="rounded-full"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Task Name Input */}
                        <FormField
                            control={form.control}
                            name="taskName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> {t('addJob.taskName')}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('addJob.placeholderTaskName')}
                                            className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Assignee Selection */}
                            <FormField
                                control={form.control}
                                name="assignee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <User className="w-4 h-4" /> {t('addJob.assignee')}
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    list="assignee-list"
                                                    placeholder={t('addJob.selectUser') || "Type or select user"}
                                                    className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground w-full"
                                                />
                                                <datalist id="assignee-list">
                                                    <option value="Unassigned" />
                                                    {users.map((user) => (
                                                        <option key={user} value={user} />
                                                    ))}
                                                </datalist>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    You can type a new name or select from the dropdown.
                                                </p>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status Selection */}
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> {t('addJob.status')}
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue placeholder={t('addJob.selectStatus')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Pending">{t('status.Pending')}</SelectItem>
                                                <SelectItem value="In Progress">{t('status.In Progress')}</SelectItem>
                                                <SelectItem value="Completed">{t('status.Completed')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Note Input */}
                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addJob.workDescription')}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('addJob.placeholderDescription')}
                                            className="min-h-[120px] bg-white/5 border-white/10 focus:border-primary/50 resize-none text-lg"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 shadow-lg shadow-indigo-500/25 transition-all duration-300"
                            disabled={isanalyzing}
                        >
                            {isanalyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {t('addJob.analyzingButton')}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    {t('addJob.analyzeButton')}
                                </>
                            )}
                        </Button>

                    </form>
                </Form>
            </Card>
        </div>
    );
}
