export interface SheetJobEntry {
    date: string;
    taskName: string;
    assignee: string;
    status: string;
    description: string;
    cost: number;
    imageUrl: string;
}

export interface SheetJobUpdate {
    date: string;
    taskName: string;
    assignee: string;
    status: string;
    description: string;
    cost: number;
}

export interface ReimbursementDocInput {
    date: string;
    payer: string;
    category: string;
    description: string;
    amount: number;
    taxId?: string;
    slipUrl?: string;
}

