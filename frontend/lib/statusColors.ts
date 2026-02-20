type StatusType = "Pending" | "In Progress" | "Completed" | string;

const STATUS_MAP: Record<string, { dot: string; bg: string; text: string; ring: string }> = {
    Completed: { dot: "bg-emerald-400", bg: "bg-emerald-500/20", text: "text-emerald-300", ring: "hover:ring-emerald-500/40" },
    "In Progress": { dot: "bg-blue-400", bg: "bg-blue-500/20", text: "text-blue-300", ring: "hover:ring-blue-500/40" },
    Pending: { dot: "bg-amber-400", bg: "bg-amber-500/20", text: "text-amber-300", ring: "hover:ring-amber-500/40" },
};

const DEFAULT_STATUS = STATUS_MAP.Pending;

export function getStatusColors(status: StatusType) {
    return STATUS_MAP[status] || DEFAULT_STATUS;
}

export const ALL_STATUSES: StatusType[] = ["Pending", "In Progress", "Completed"];
