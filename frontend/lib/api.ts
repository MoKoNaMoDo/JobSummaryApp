import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// --- Project Service ---

export interface Project {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    color: string;
    stats?: { total: number; completed: number; totalCost: number };
}

export const projectService = {
    getAll: async (): Promise<Project[]> => {
        const response = await api.get("/projects");
        return response.data;
    },

    create: async (name: string, color?: string): Promise<Project> => {
        const response = await api.post("/projects", { name, color });
        return response.data.data;
    },

    update: async (id: string, data: { name?: string; color?: string }) => {
        const response = await api.patch(`/projects/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/projects/${id}`);
        return response.data;
    },
};

// --- Job Service (project-scoped) ---

export const jobService = {
    submitJob: async (formData: FormData) => {
        const response = await api.post("/jobs", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    getJobs: async (projectSlug?: string) => {
        const params = projectSlug ? { projectSlug } : {};
        const response = await api.get("/jobs", { params });
        return response.data;
    },

    saveConfig: async (config: Record<string, unknown>) => {
        const response = await api.post("/config", config);
        return response.data;
    },

    getConfig: async () => {
        const response = await api.get("/config");
        return response.data;
    },

    updateJobStatus: async (id: number, sheetName: string, status: string) => {
        const response = await api.patch("/jobs/status", { id, sheetName, status });
        return response.data;
    },

    updateJob: async (data: Record<string, unknown>) => {
        const response = await api.patch("/jobs", data);
        return response.data;
    },

    deleteJob: async (id: number, sheetName: string) => {
        const response = await api.delete("/jobs", { data: { id, sheetName } });
        return response.data;
    },
    refineText: async (text: string, mode: 'refine' | 'expand' | 'organize' | 'title' | 'shorten', language: 'th' | 'en' = 'th') => {
        const response = await api.post("/ai/refine", { text, mode, language });
        return response.data;
    }
};
