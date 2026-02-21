import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { GoogleService } from '../services/googleService';
import { ConfigService } from '../services/configService';

export const getJobs = async (req: Request, res: Response) => {
    try {
        const projectSlug = req.query.projectSlug as string | undefined;
        const jobs = await GoogleService.getReimbursements(undefined, undefined, "Jobs", projectSlug);
        res.json(jobs);
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
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

        // 1. Analyze with Gemini
        console.log("Analyzing Job...");
        const analysis = await GeminiService.analyzeJob(
            note || "",
            file?.buffer,
            file?.mimetype
        );
        console.log("Analysis Result:", analysis);

        // 2. Upload Image if exists
        let imageUrl = "";
        if (file) {
            console.log("Uploading Image...");
            imageUrl = await GoogleService.uploadSlip(file, userTaskName || analysis.taskName || analysis.category || "Job", analysis.date, "Jobs");
        }

        // 3. Save to Google Sheets
        console.log("Saving to Sheets...");

        const finalAssignee = assignee || "Unassigned";
        const finalStatus = status || analysis.status || "Pending";
        const finalTaskName = userTaskName || analysis.taskName || "Untitled Task";

        await GoogleService.appendToSheet({
            date: analysis.date || new Date().toISOString().split('T')[0],
            taskName: finalTaskName,
            assignee: finalAssignee,
            status: finalStatus,
            description: analysis.description || note,
            cost: analysis.cost || 0,
            imageUrl: imageUrl,
        }, "Jobs", projectSlug);

        res.json({
            status: 'success',
            message: 'Job saved successfully',
            data: {
                ...analysis,
                assignee: finalAssignee,
                status: finalStatus,
                imageUrl
            }
        });

    } catch (error: any) {
        console.error("Error submitting job:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const updateJobStatus = async (req: Request, res: Response) => {
    try {
        const { id, sheetName, status } = req.body;
        if (!id || !sheetName || !status) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }

        await GoogleService.updateRowStatus(sheetName, Number(id), status, "Jobs");
        res.json({ status: 'success', message: 'Status updated successfully' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
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
            date,
            taskName,
            assignee,
            status,
            description,
            cost: Number(cost) || 0
        }, "Jobs");

        res.json({ status: 'success', message: 'Job updated successfully' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const deleteJob = async (req: Request, res: Response) => {
    try {
        const id = req.body.id || req.query.id;
        const sheetName = req.body.sheetName || req.query.sheetName;

        if (!id || !sheetName) {
            res.status(400).json({ status: 'error', message: 'Missing target Job ID or SheetName for deletion' });
            return;
        }

        await GoogleService.deleteRow(String(sheetName), Number(id), "Jobs");
        res.json({ status: 'success', message: 'Job deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
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
        if (!['refine', 'expand', 'organize', 'title', 'shorten'].includes(mode)) {
            res.status(400).json({ status: 'error', message: 'Invalid mode' });
            return;
        }

        const refined = await GeminiService.refineText(text, mode as any, lang);
        res.json({ status: 'success', data: refined });
    } catch (error: any) {
        console.error("AI Refine Controller Error:", error);

        let message = error.message || "Internal Server Error during AI Refinement";
        let statusCode = 500;

        if (message.includes("quota") || message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
            message = "AI Rate limit reached (Gemini Free Tier). Please wait a minute and try again.";
            statusCode = 429;
        } else if (message.includes("API key not valid") || message.includes("INVALID_ARGUMENT")) {
            message = "Invalid AI API Key. Please check your configuration.";
            statusCode = 401;
        }

        res.status(statusCode).json({ status: 'error', message });
    }
};
