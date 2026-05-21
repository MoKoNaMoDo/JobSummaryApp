"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { th } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { jobService } from "@/lib/api";
import type { Job } from "@/components/features/JobCard/JobCard";
import ViewJobDialog from "@/components/dialogs/ViewJobDialog/ViewJobDialog";
import EditJobDialog from "@/components/dialogs/EditJobDialog/EditJobDialog";
import { useLanguage } from "@/components/features/LanguageProvider/LanguageProvider";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withDragAndDrop = require("react-big-calendar/lib/addons/dragAndDrop").default;

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
    getDay,
    locales: { th },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DnDCalendar = withDragAndDrop(Calendar) as any;

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    resource: Job;
}

const STATUS_COLORS: Record<string, string> = {
    Pending: "#f59e0b",
    "In Progress": "#3b82f6",
    Completed: "#10b981",
};

function jobToEvent(job: Job): CalendarEvent {
    const [y, m, d] = job.date.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    let end = new Date(y, m - 1, d);

    if (job.completedDate && job.status === "Completed" && job.completedDate > job.date) {
        const [ey, em, ed] = job.completedDate.split("-").map(Number);
        // +1 day because react-big-calendar allDay end is exclusive
        end = new Date(ey, em - 1, ed + 1);
    }

    return {
        id: `${job.id}-${job.sheetName}`,
        title: job.taskName || job.category || "งาน",
        start,
        end,
        allDay: true,
        resource: job,
    };
}

export default function CalendarPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    const { t } = useLanguage();
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<View>("month");
    const [viewingJob, setViewingJob] = useState<Job | null>(null);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [users, setUsers] = useState<string[]>([]);

    const loadJobs = useCallback(
        async (date: Date) => {
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = String(date.getFullYear());
            setLoading(true);
            try {
                const [jobsData, configData] = await Promise.all([
                    jobService.getJobs(slug, month, year),
                    jobService.getConfig(),
                ]);
                setJobs(Array.isArray(jobsData) ? jobsData : []);
                if (configData.data?.users) setUsers(configData.data.users);
            } catch {
                toast.error("โหลดงานไม่สำเร็จ");
            } finally {
                setLoading(false);
            }
        },
        [slug]
    );

    useEffect(() => {
        loadJobs(currentDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const events: CalendarEvent[] = jobs.map(jobToEvent);

    const eventPropGetter = (event: CalendarEvent) => {
        const color = STATUS_COLORS[event.resource.status] || STATUS_COLORS.Pending;
        return {
            style: {
                backgroundColor: `${color}22`,
                borderLeft: `3px solid ${color}`,
                color: "rgba(255,255,255,0.85)",
                borderRadius: "6px",
                border: "none",
                fontSize: "11px",
                padding: "2px 6px",
                cursor: "pointer",
            },
        };
    };

    const handleNavigate = (date: Date) => {
        setCurrentDate(date);
        loadJobs(date);
    };

    const handleSelectSlot = ({ start }: { start: Date }) => {
        const dateStr = format(start, "yyyy-MM-dd");
        router.push(`/projects/${slug}/add?date=${dateStr}`);
    };

    const handleEventDrop = async ({
        event,
        start,
    }: {
        event: CalendarEvent;
        start: Date | string;
        end: Date | string;
        isAllDay: boolean;
    }) => {
        const newDate = format(new Date(start), "yyyy-MM-dd");
        const job = event.resource;
        if (newDate === job.date) return;

        try {
            await jobService.updateJob({
                ...job,
                date: newDate,
            } as unknown as Record<string, unknown>);
            setJobs((prev) =>
                prev.map((j) =>
                    j.id === job.id && j.sheetName === job.sheetName
                        ? { ...j, date: newDate }
                        : j
                )
            );
            toast.success("อัปเดตวันที่แล้ว");
        } catch {
            toast.error("อัปเดตวันที่ไม่สำเร็จ");
        }
    };

    const handleEditSave = async () => {
        if (!editingJob) return;
        try {
            await jobService.updateJob(editingJob as unknown as Record<string, unknown>);
            setJobs((prev) =>
                prev.map((j) =>
                    j.id === editingJob.id && j.sheetName === editingJob.sheetName
                        ? editingJob
                        : j
                )
            );
            setIsEditOpen(false);
            toast.success(t("dashboard.jobUpdated"));
        } catch {
            toast.error(t("dashboard.updateFailed"));
        }
    };

    function getDriveImageUrl(url: string | undefined): string {
        if (!url || url === "UPLOAD_FAILED") return "";
        if (url.includes("lh3.googleusercontent.com") || url.includes("/thumbnail?")) return url;
        const patterns = [
            /\/d\/([a-zA-Z0-9_-]{10,})/,
            /[?&]id=([a-zA-Z0-9_-]{10,})/,
            /\/open\?id=([a-zA-Z0-9_-]{10,})/,
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match?.[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
        }
        return url;
    }

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-[11px] text-slate-600">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <span key={status} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        {status === "In Progress" ? "กำลังทำ" : status === "Pending" ? "รอดำเนินการ" : "เสร็จสิ้น"}
                    </span>
                ))}
                <span className="ml-auto text-slate-700 text-[10px]">คลิกช่องว่างเพื่อเพิ่มงาน</span>
            </div>

            {/* Calendar */}
            <div
                className={`rbc-dark-wrapper transition-opacity duration-200 ${loading ? "opacity-40 pointer-events-none" : ""}`}
                style={{ height: 640 }}
            >
                <DnDCalendar
                    localizer={localizer}
                    events={events}
                    view={view}
                    onView={(v: View) => setView(v)}
                    date={currentDate}
                    onNavigate={handleNavigate}
                    eventPropGetter={eventPropGetter}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={(event: CalendarEvent) => setViewingJob(event.resource)}
                    onEventDrop={handleEventDrop}
                    selectable
                    resizable={false}
                    culture="th"
                    views={["month", "week", "day"]}
                    messages={{
                        today: "วันนี้",
                        previous: "‹",
                        next: "›",
                        month: "เดือน",
                        week: "สัปดาห์",
                        day: "วัน",
                        agenda: "รายการ",
                        showMore: (count: number) => `+${count} งาน`,
                        date: "วันที่",
                        time: "เวลา",
                        event: "งาน",
                        noEventsInRange: "ไม่มีงานในช่วงนี้",
                    }}
                />
            </div>

            {/* Dialogs */}
            <ViewJobDialog
                job={viewingJob}
                t={t}
                getDriveImageUrl={getDriveImageUrl}
                onClose={() => setViewingJob(null)}
                onEdit={(job) => {
                    setEditingJob(job);
                    setIsEditOpen(true);
                }}
                onStatusChange={async (job, status) => {
                    try {
                        await jobService.updateJobStatus(Number(job.id), job.sheetName || "", status);
                        setJobs((prev) =>
                            prev.map((j) =>
                                j.id === job.id && j.sheetName === job.sheetName
                                    ? { ...j, status: status as Job["status"] }
                                    : j
                            )
                        );
                        setViewingJob({ ...job, status: status as Job["status"] });
                        toast.success(t("dashboard.statusUpdated"));
                    } catch {
                        toast.error(t("dashboard.statusFailed"));
                    }
                }}
            />
            <EditJobDialog
                job={editingJob}
                open={isEditOpen}
                users={users}
                saving={false}
                t={t}
                onJobChange={setEditingJob}
                onSave={handleEditSave}
                onClose={() => setIsEditOpen(false)}
            />
        </div>
    );
}
