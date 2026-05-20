import { Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import { GoogleService } from '../services/googleService';
import { errMsg } from '../utils/errMsg';

interface JobEntry { status?: string; cost?: number }

export const getProjects = async (_req: Request, res: Response) => {
    try {
        const projects = await ProjectService.getAll();
        const enriched = await Promise.all(
            projects.map(async (p) => {
                try {
                    const jobs = await GoogleService.getReimbursements(undefined, undefined, 'Jobs', p.slug) as JobEntry[];
                    return {
                        ...p,
                        stats: {
                            total: jobs.length,
                            completed: jobs.filter((j) => j.status === 'Completed').length,
                            totalCost: jobs.reduce((sum, j) => sum + (j.cost ?? 0), 0),
                        },
                    };
                } catch {
                    return { ...p, stats: { total: 0, completed: 0, totalCost: 0 } };
                }
            }),
        );
        res.json(enriched);
    } catch (error: unknown) {
        res.status(500).json({ status: 'error', message: errMsg(error) });
    }
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const { name, color } = req.body;
        if (!name?.trim()) {
            res.status(400).json({ status: 'error', message: 'Project name is required' });
            return;
        }
        const project = await ProjectService.create(name.trim(), color);
        res.json({ status: 'success', data: project });
    } catch (error: unknown) {
        res.status(500).json({ status: 'error', message: errMsg(error) });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { name, color } = req.body;
        const updated = await ProjectService.update(id, { name, color });
        if (!updated) {
            res.status(404).json({ status: 'error', message: 'Project not found' });
            return;
        }
        res.json({ status: 'success', data: updated });
    } catch (error: unknown) {
        res.status(500).json({ status: 'error', message: errMsg(error) });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const success = await ProjectService.delete(id);
        if (!success) {
            res.status(404).json({ status: 'error', message: 'Project not found' });
            return;
        }
        res.json({ status: 'success', message: 'Project deleted' });
    } catch (error: unknown) {
        res.status(500).json({ status: 'error', message: errMsg(error) });
    }
};
