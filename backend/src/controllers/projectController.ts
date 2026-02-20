import { Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import { GoogleService } from '../services/googleService';

export const getProjects = async (_req: Request, res: Response) => {
    try {
        const projects = ProjectService.getAll();

        // Enrich with job stats for each project
        const enriched = await Promise.all(projects.map(async (p) => {
            try {
                const jobs = await GoogleService.getReimbursements(undefined, undefined, "Jobs", p.slug);
                const total = jobs.length;
                const completed = jobs.filter((j: any) => j.status === 'Completed').length;
                const totalCost = jobs.reduce((sum: number, j: any) => sum + (j.cost || 0), 0);
                return { ...p, stats: { total, completed, totalCost } };
            } catch {
                return { ...p, stats: { total: 0, completed: 0, totalCost: 0 } };
            }
        }));

        res.json(enriched);
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const { name, color } = req.body;
        if (!name || !name.trim()) {
            res.status(400).json({ status: 'error', message: 'Project name is required' });
            return;
        }

        const project = ProjectService.create(name.trim(), color);
        res.json({ status: 'success', data: project });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { name, color } = req.body;

        const updated = ProjectService.update(id, { name, color });
        if (!updated) {
            res.status(404).json({ status: 'error', message: 'Project not found' });
            return;
        }

        res.json({ status: 'success', data: updated });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const success = ProjectService.delete(id);
        if (!success) {
            res.status(404).json({ status: 'error', message: 'Project not found' });
            return;
        }

        res.json({ status: 'success', message: 'Project deleted' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
