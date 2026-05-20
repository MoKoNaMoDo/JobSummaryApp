import http from "@/lib/http";

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
        const response = await http.get("/projects");
        return response.data;
    },

    create: async (name: string, color?: string): Promise<Project> => {
        const response = await http.post("/projects", { name, color });
        return response.data.data;
    },

    update: async (id: string, data: { name?: string; color?: string }) => {
        const response = await http.patch(`/projects/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string) => {
        const response = await http.delete(`/projects/${id}`);
        return response.data;
    },
};
