import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { GoogleService } from '../services/googleService';
import { ConfigService } from '../services/configService';

export const getJobs = async (req: Request, res: Response) => {
    try {
        const jobs = await GoogleService.getReimbursements(undefined, undefined, "Jobs");
        res.json(jobs);
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const submitJob = async (req: Request, res: Response) => {
    try {
        const { note, assignee, status } = req.body; // assignee and status might come from frontend now
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
            // Use taskName or category for file context
            imageUrl = await GoogleService.uploadSlip(file, analysis.taskName || analysis.category || "Job", analysis.date, "Jobs");
        }

        // 3. Save to Google Sheets (New Schema)
        console.log("Saving to Sheets...");

        // Use user-provided assignee/status if available, otherwise fallback to AI/Default
        const finalAssignee = assignee || "Unassigned";
        const finalStatus = status || analysis.status || "Pending";

        await GoogleService.appendToSheet({
            date: analysis.date || new Date().toISOString().split('T')[0],
            taskName: analysis.taskName || "Untitled Task",
            assignee: finalAssignee,
            status: finalStatus,
            description: analysis.description || note,
            cost: analysis.cost || 0,
            imageUrl: imageUrl,
        }, "Jobs");

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
        // Assume DELETE uses query params or body. Let's support body or query.
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
