"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const uuid_1 = require("uuid");
const googleService_1 = require("./googleService");
const configService_1 = require("./configService");
const TAB_NAME = '_SYS_PROJECTS';
function slugify(name) {
    return name
        .toLowerCase()
        .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '') // keep Thai, alphanumeric, spaces, dashes
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
exports.ProjectService = {
    async getAll() {
        try {
            const spreadsheetId = configService_1.ConfigService.get('googleSheetIdJobs');
            if (!spreadsheetId)
                return [];
            const rows = await googleService_1.GoogleService.readTab(spreadsheetId, TAB_NAME);
            if (rows.length < 2)
                return []; // Header only or empty
            // First row is header: id, name, slug, createdAt, color
            return rows.slice(1).map(row => ({
                id: row[0],
                name: row[1],
                slug: row[2],
                createdAt: row[3],
                color: row[4]
            }));
        }
        catch (e) {
            console.error("Error reading projects from Sheets:", e);
            return [];
        }
    },
    async save(projects) {
        try {
            const spreadsheetId = configService_1.ConfigService.get('googleSheetIdJobs');
            if (!spreadsheetId)
                return false;
            const header = ['id', 'name', 'slug', 'createdAt', 'color'];
            const rows = [
                header,
                ...projects.map(p => [p.id, p.name, p.slug, p.createdAt, p.color])
            ];
            await googleService_1.GoogleService.writeTab(spreadsheetId, TAB_NAME, rows);
            return true;
        }
        catch (e) {
            console.error("Error saving projects to Sheets:", e);
            return false;
        }
    },
    async create(name, color) {
        const projects = await this.getAll();
        let slug = slugify(name);
        // Ensure unique slug
        let counter = 1;
        const baseSlug = slug;
        while (projects.some(p => p.slug === slug)) {
            slug = `${baseSlug}-${counter++}`;
        }
        const project = {
            id: (0, uuid_1.v4)(),
            name,
            slug,
            createdAt: new Date().toISOString().split('T')[0],
            color: color || PROJECT_COLORS[projects.length % PROJECT_COLORS.length]
        };
        projects.push(project);
        await this.save(projects);
        return project;
    },
    async getBySlug(slug) {
        const projects = await this.getAll();
        return projects.find(p => p.slug === slug);
    },
    async update(id, data) {
        const projects = await this.getAll();
        const idx = projects.findIndex(p => p.id === id);
        if (idx === -1)
            return null;
        if (data.name)
            projects[idx].name = data.name;
        if (data.color)
            projects[idx].color = data.color;
        await this.save(projects);
        return projects[idx];
    },
    async delete(id) {
        const projects = await this.getAll();
        const filtered = projects.filter(p => p.id !== id);
        if (filtered.length === projects.length)
            return false;
        return await this.save(filtered);
    }
};
