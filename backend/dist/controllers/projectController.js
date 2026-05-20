"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjects = void 0;
const projectService_1 = require("../services/projectService");
const googleService_1 = require("../services/googleService");
const getProjects = async (_req, res) => {
    try {
        const projects = await projectService_1.ProjectService.getAll();
        // Enrich with job stats for each project
        const enriched = await Promise.all(projects.map(async (p) => {
            try {
                const jobs = await googleService_1.GoogleService.getReimbursements(undefined, undefined, "Jobs", p.slug);
                const total = jobs.length;
                const completed = jobs.filter((j) => j.status === 'Completed').length;
                const totalCost = jobs.reduce((sum, j) => sum + (j.cost || 0), 0);
                return { ...p, stats: { total, completed, totalCost } };
            }
            catch {
                return { ...p, stats: { total: 0, completed: 0, totalCost: 0 } };
            }
        }));
        res.json(enriched);
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.getProjects = getProjects;
const createProject = async (req, res) => {
    try {
        const { name, color } = req.body;
        if (!name || !name.trim()) {
            res.status(400).json({ status: 'error', message: 'Project name is required' });
            return;
        }
        const project = await projectService_1.ProjectService.create(name.trim(), color);
        res.json({ status: 'success', data: project });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.createProject = createProject;
const updateProject = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { name, color } = req.body;
        const updated = await projectService_1.ProjectService.update(id, { name, color });
        if (!updated) {
            res.status(404).json({ status: 'error', message: 'Project not found' });
            return;
        }
        res.json({ status: 'success', data: updated });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const id = String(req.params.id);
        const success = await projectService_1.ProjectService.delete(id);
        if (!success) {
            res.status(404).json({ status: 'error', message: 'Project not found' });
            return;
        }
        res.json({ status: 'success', message: 'Project deleted' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.deleteProject = deleteProject;
