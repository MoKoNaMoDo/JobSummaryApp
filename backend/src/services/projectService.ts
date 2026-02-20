import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const PROJECTS_PATH = path.join(__dirname, '../../data/projects.json');

export interface Project {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    color: string;
}

// Ensure data directory exists
try {
    const dir = path.dirname(PROJECTS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
} catch { /* read-only env */ }

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
    getAll(): Project[] {
        try {
            if (fs.existsSync(PROJECTS_PATH)) {
                return JSON.parse(fs.readFileSync(PROJECTS_PATH, 'utf-8'));
            }
        } catch (e) {
            console.error("Error reading projects:", e);
        }
        return [];
    },

    save(projects: Project[]): boolean {
        try {
            fs.writeFileSync(PROJECTS_PATH, JSON.stringify(projects, null, 2));
            return true;
        } catch (e) {
            console.error("Error saving projects:", e);
            return false;
        }
    },

    create(name: string, color?: string): Project {
        const projects = this.getAll();
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
        this.save(projects);
        return project;
    },

    getBySlug(slug: string): Project | undefined {
        return this.getAll().find(p => p.slug === slug);
    },

    update(id: string, data: Partial<Pick<Project, 'name' | 'color'>>): Project | null {
        const projects = this.getAll();
        const idx = projects.findIndex(p => p.id === id);
        if (idx === -1) return null;

        if (data.name) projects[idx].name = data.name;
        if (data.color) projects[idx].color = data.color;

        this.save(projects);
        return projects[idx];
    },

    delete(id: string): boolean {
        const projects = this.getAll();
        const filtered = projects.filter(p => p.id !== id);
        if (filtered.length === projects.length) return false;
        return this.save(filtered);
    }
};
