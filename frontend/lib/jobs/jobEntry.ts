export type JobStatus = "Pending" | "In Progress" | "Completed";

export interface JobEntry {
    id: string;
    taskName: string;
    workDate?: string;
    note: string;
    assignee: string;
    status: JobStatus;
    file: File | null;
    preview: string | null;
    isSubmitting: boolean;
    isSubmitted: boolean;
}

export const todayISO = () => new Date().toISOString().split("T")[0];

export const createEmptyJobEntry = (includeWorkDate = false): JobEntry => ({
    id: crypto.randomUUID(),
    taskName: "",
    workDate: includeWorkDate ? todayISO() : undefined,
    note: "",
    assignee: "",
    status: "Pending",
    file: null,
    preview: null,
    isSubmitting: false,
    isSubmitted: false,
});

