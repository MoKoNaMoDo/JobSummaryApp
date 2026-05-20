import http from "@/lib/http";

export const jobService = {
    submitJob: async (formData: FormData) => {
        const response = await http.post("/jobs", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    getJobs: async (projectSlug?: string) => {
        const params = projectSlug ? { projectSlug } : {};
        const response = await http.get("/jobs", { params });
        return response.data;
    },

    saveConfig: async (config: Record<string, unknown>) => {
        const response = await http.post("/config", config);
        return response.data;
    },

    getConfig: async () => {
        const response = await http.get("/config");
        return response.data;
    },

    updateJobStatus: async (id: number, sheetName: string, status: string) => {
        const response = await http.patch("/jobs/status", { id, sheetName, status });
        return response.data;
    },

    updateJob: async (data: Record<string, unknown>) => {
        const response = await http.patch("/jobs", data);
        return response.data;
    },

    deleteJob: async (id: number, sheetName: string) => {
        const response = await http.delete("/jobs", { data: { id, sheetName } });
        return response.data;
    },

    refineText: async (
        text: string,
        mode: "refine" | "expand" | "organize" | "title" | "shorten",
        language: "th" | "en" = "th"
    ) => {
        const response = await http.post("/ai/refine", { text, mode, language });
        return response.data;
    },
};
