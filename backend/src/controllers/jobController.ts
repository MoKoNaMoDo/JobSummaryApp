import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { GoogleService } from '../services/googleService';
import { errMsg } from '../utils/errMsg';

type RefineMode = 'refine' | 'expand' | 'organize' | 'title' | 'shorten';
const VALID_MODES: RefineMode[] = ['refine', 'expand', 'organize', 'title', 'shorten'];

export const getJobs = async (req: Request, res: Response) => {
    try {
        const projectSlug = req.query.projectSlug as string | undefined;
        const jobs = await GoogleService.getReimbursements(undefined, undefined, 'Jobs', projectSlug);
        res.json(jobs);
    } catch (error: unknown) {
        res.status(500).json({ status: 'error', message: errMsg(error) });
    }
};

export const submitJob = async (req: Request, res: Response) => {
    try {
        const { note, assignee, status, taskName: userTaskName, projectSlug } = req.body;
        const file = req.file;

        if (!note && !file) {
            res.status(400).json({ status: 'error', message: 'Note or Image is required' });
            return;
        }

        const analysis = await GeminiService.analyzeJob(note || '', file?.buffer, file?.mimetype);

        let imageUrl = '';
        if (file) {
            imageUrl = await GoogleService.uploadSlip(
                file,
                userTaskName || analysis.taskName || analysis.category || 'Job',
                analysis.date,
                'Jobs',
            );
        }

        const finalAssignee = assignee || 'Unassigned';
        const finalStatus = status || analysis.status || 'Pending';
        const finalTaskName = userTaskName || analysis.taskName || 'Untitled Task';

        await GoogleService.appendToSheet({
            date: analysis.date || new Date().toISOString().split('T')[0],
            taskName: finalTaskName,
            assignee: finalAssignee,
            status: finalStatus,
            description: analysis.description || note,
            cost: analysis.cost || 0,
            imageUrl,
        }, 'Jobs', projectSlug);

        res.json({
            status: 'success',
            message: 'Job saved successfully',
            data: { ...analysis, assignee: finalAssignee, status: finalStatus, imageUrl },
        });
    } catch (error: unknown) {
        res.status(500).json({ status: 'error', message: errMsg(error) });
    }
};

export const updateJobStatus = async (req: Request, res: Response) => {
    try {
        const { id, sheetName, status } = req.body;
        if (!id || !sheetName || !status) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }
        await GoogleService.updateRowStatus(sheetName, Number(id), status, 'Jobs');
        res.json({ status: 'success', message: 'Status updated successfully' });
    } catch (error: unknown) {
        res.status(500).json({ status: 'error', message: errMsg(error) });
    }
};

export const updateJob = async (req: Request, res: Response) => {
    try {
        const { id, sheetName, date, taskName, assignee, status, description, cost } = req.body;
        if (!id || !sheetName) {
            res.status(400).json({ status: 'error', message: 'Missing target Job ID or SheetName' });
            return;
        }
        await GoogleService.updateRowData(sheetName, Number(id), {
            date, taskName, assignee, status, description, cost: Number(cost) || 0,
        }, 'Jobs');
        res.json({ status: 'success', message: 'Job updated successfully' });
    } catch (error: unknown) {
        res.status(500).json({ status: 'error', message: errMsg(error) });
    }
};

export const deleteJob = async (req: Request, res: Response) => {
    try {
        const id = req.body.id ?? req.query.id;
        const sheetName = req.body.sheetName ?? req.query.sheetName;
        if (!id || !sheetName) {
            res.status(400).json({ status: 'error', message: 'Missing target Job ID or SheetName' });
            return;
        }
        await GoogleService.deleteRow(String(sheetName), Number(id), 'Jobs');
        res.json({ status: 'success', message: 'Job deleted successfully' });
    } catch (error: unknown) {
        res.status(500).json({ status: 'error', message: errMsg(error) });
    }
};

export const refineJobText = async (req: Request, res: Response) => {
    try {
        const { text, mode, language } = req.body;
        const lang = language === 'en' ? 'en' : 'th';

        if (!text) {
            res.status(400).json({ status: 'error', message: 'Text is required' });
            return;
        }
        if (!VALID_MODES.includes(mode)) {
            res.status(400).json({ status: 'error', message: 'Invalid mode' });
            return;
        }

        const refined = await GeminiService.refineText(text, mode as RefineMode, lang);
        res.json({ status: 'success', data: refined });
    } catch (error: unknown) {
        const msg = errMsg(error);
        if (msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
            res.status(429).json({ status: 'error', message: 'AI Rate limit reached. Please wait a moment and try again.' });
        } else if (msg.includes('API key not valid') || msg.includes('INVALID_ARGUMENT')) {
            res.status(401).json({ status: 'error', message: 'Invalid AI API Key. Check your configuration.' });
        } else {
            res.status(500).json({ status: 'error', message: msg });
        }
    }
};
