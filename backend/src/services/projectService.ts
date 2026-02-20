import { v4 as uuidv4 } from 'uuid';
import { GoogleService } from './googleService';
import { ConfigService } from './configService';

export interface Project {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    color: string;
}

const TAB_NAME = '_SYS_PROJECTS';

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '')  // keep Thai, alphanumeric, spaces, dashes
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        || `project-${Date.now()}`;
}

const PROJECT_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6'
];

export const ProjectService = {
    async getAll(): Promise<Project[]> {
        try {
            const spreadsheetId = ConfigService.get('googleSheetIdJobs');
            if (!spreadsheetId) return [];

            const rows = await GoogleService.readTab(spreadsheetId, TAB_NAME);
            if (rows.length < 2) return []; // Header only or empty

            // First row is header: id, name, slug, createdAt, color
            return rows.slice(1).map(row => ({
                id: row[0],
                name: row[1],
                slug: row[2],
                createdAt: row[3],
                color: row[4]
            }));
        } catch (e) {
            console.error("Error reading projects from Sheets:", e);
            return [];
        }
    },

    async save(projects: Project[]): Promise<boolean> {
        try {
            const spreadsheetId = ConfigService.get('googleSheetIdJobs');
            if (!spreadsheetId) return false;

            const header = ['id', 'name', 'slug', 'createdAt', 'color'];
            const rows = [
                header,
                ...projects.map(p => [p.id, p.name, p.slug, p.createdAt, p.color])
            ];

            await GoogleService.writeTab(spreadsheetId, TAB_NAME, rows);
            return true;
        } catch (e) {
            console.error("Error saving projects to Sheets:", e);
            return false;
        }
    },

    async create(name: string, color?: string): Promise<Project> {
        const projects = await this.getAll();
        let slug = slugify(name);

        // Ensure unique slug
        let counter = 1;
        const baseSlug = slug;
        while (projects.some(p => p.slug === slug)) {
            slug = `${baseSlug}-${counter++}`;
        }

        const project: Project = {
            id: uuidv4(),
            name,
            slug,
            createdAt: new Date().toISOString().split('T')[0],
            color: color || PROJECT_COLORS[projects.length % PROJECT_COLORS.length]
        };

        projects.push(project);
        await this.save(projects);
        return project;
    },

    async getBySlug(slug: string): Promise<Project | undefined> {
        const projects = await this.getAll();
        return projects.find(p => p.slug === slug);
    },

    async update(id: string, data: Partial<Pick<Project, 'name' | 'color'>>): Promise<Project | null> {
        const projects = await this.getAll();
        const idx = projects.findIndex(p => p.id === id);
        if (idx === -1) return null;

        if (data.name) projects[idx].name = data.name;
        if (data.color) projects[idx].color = data.color;

        await this.save(projects);
        return projects[idx];
    },

    async delete(id: string): Promise<boolean> {
        const projects = await this.getAll();
        const filtered = projects.filter(p => p.id !== id);
        if (filtered.length === projects.length) return false;
        return await this.save(filtered);
    }
};
