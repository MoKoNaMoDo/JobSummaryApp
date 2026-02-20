import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "/api", // Use Env Var for Production, fallback to Proxy
    headers: {
        "Content-Type": "application/json",
    },
});

export const jobService = {
    // Submit a new job (Text + Image)
    submitJob: async (formData: FormData) => {
        const response = await api.post("/jobs", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    // Get all jobs
    getJobs: async () => {
        const response = await api.get("/jobs");
        return response.data;
    },

    // Save Settings
    saveConfig: async (config: any) => {
        const response = await api.post("/config", config);
        return response.data;
    },

    // Get Settings
    getConfig: async () => {
        const response = await api.get("/config");
        return response.data;
    },

    // Update Job Status
    updateJobStatus: async (id: number, sheetName: string, status: string) => {
        const response = await api.patch("/jobs/status", { id, sheetName, status });
        return response.data;
    },

    // Update Full Job Details
    updateJob: async (data: any) => {
        const response = await api.patch("/jobs", data);
        return response.data;
    },

    // Delete Job
    deleteJob: async (id: number, sheetName: string) => {
        const response = await api.delete("/jobs", { data: { id, sheetName } });
        return response.data;
    }
};
