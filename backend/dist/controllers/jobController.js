"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refineJobText = exports.deleteJob = exports.updateJob = exports.updateJobStatus = exports.submitJob = exports.getJobs = void 0;
const geminiService_1 = require("../services/geminiService");
const googleService_1 = require("../services/googleService");
const getJobs = async (req, res) => {
    try {
        const projectSlug = req.query.projectSlug;
        const jobs = await googleService_1.GoogleService.getReimbursements(undefined, undefined, "Jobs", projectSlug);
        res.json(jobs);
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.getJobs = getJobs;
const submitJob = async (req, res) => {
    try {
        const { note, assignee, status, taskName: userTaskName, projectSlug } = req.body;
        const file = req.file;
        if (!note && !file) {
            res.status(400).json({ status: 'error', message: 'Note or Image is required' });
            return;
        }
        // 1. Analyze with Gemini
        console.log("Analyzing Job...");
        const analysis = await geminiService_1.GeminiService.analyzeJob(note || "", file?.buffer, file?.mimetype);
        console.log("Analysis Result:", analysis);
        // 2. Upload Image if exists
        let imageUrl = "";
        if (file) {
            console.log("Uploading Image...");
            imageUrl = await googleService_1.GoogleService.uploadSlip(file, userTaskName || analysis.taskName || analysis.category || "Job", analysis.date, "Jobs");
        }
        // 3. Save to Google Sheets
        console.log("Saving to Sheets...");
        const finalAssignee = assignee || "Unassigned";
        const finalStatus = status || analysis.status || "Pending";
        const finalTaskName = userTaskName || analysis.taskName || "Untitled Task";
        await googleService_1.GoogleService.appendToSheet({
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
    }
    catch (error) {
        console.error("Error submitting job:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.submitJob = submitJob;
const updateJobStatus = async (req, res) => {
    try {
        const { id, sheetName, status } = req.body;
        if (!id || !sheetName || !status) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }
        await googleService_1.GoogleService.updateRowStatus(sheetName, Number(id), status, "Jobs");
        res.json({ status: 'success', message: 'Status updated successfully' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.updateJobStatus = updateJobStatus;
const updateJob = async (req, res) => {
    try {
        const { id, sheetName, date, taskName, assignee, status, description, cost } = req.body;
        if (!id || !sheetName) {
            res.status(400).json({ status: 'error', message: 'Missing target Job ID or SheetName' });
            return;
        }
        await googleService_1.GoogleService.updateRowData(sheetName, Number(id), {
            date,
            taskName,
            assignee,
            status,
            description,
            cost: Number(cost) || 0
        }, "Jobs");
        res.json({ status: 'success', message: 'Job updated successfully' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.updateJob = updateJob;
const deleteJob = async (req, res) => {
    try {
        const id = req.body.id || req.query.id;
        const sheetName = req.body.sheetName || req.query.sheetName;
        if (!id || !sheetName) {
            res.status(400).json({ status: 'error', message: 'Missing target Job ID or SheetName for deletion' });
            return;
        }
        await googleService_1.GoogleService.deleteRow(String(sheetName), Number(id), "Jobs");
        res.json({ status: 'success', message: 'Job deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.deleteJob = deleteJob;
const refineJobText = async (req, res) => {
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
        const refined = await geminiService_1.GeminiService.refineText(text, mode, lang);
        res.json({ status: 'success', data: refined });
    }
    catch (error) {
        console.error("AI Refine Controller Error:", error);
        let message = error.message || "Internal Server Error during AI Refinement";
        let statusCode = 500;
        if (message.includes("quota") || message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
            message = "AI Rate limit reached (Gemini Free Tier). Please wait a minute and try again.";
            statusCode = 429;
        }
        else if (message.includes("API key not valid") || message.includes("INVALID_ARGUMENT")) {
            message = "Invalid AI API Key. Please check your configuration.";
            statusCode = 401;
        }
        res.status(statusCode).json({ status: 'error', message });
    }
};
exports.refineJobText = refineJobText;
