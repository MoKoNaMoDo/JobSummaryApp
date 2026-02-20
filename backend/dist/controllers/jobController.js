"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitJob = exports.getJobs = void 0;
const geminiService_1 = require("../services/geminiService");
const googleService_1 = require("../services/googleService");
const getJobs = async (req, res) => {
    try {
        const jobs = await googleService_1.GoogleService.getReimbursements(); // Reusing reimbursement logic for now as data structure is similar
        // Or better: ensure we map it correctly
        res.json(jobs);
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.getJobs = getJobs;
const submitJob = async (req, res) => {
    try {
        const { note, assignee, status } = req.body; // assignee and status might come from frontend now
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
            // Use taskName or category for file context
            imageUrl = await googleService_1.GoogleService.uploadSlip(file, analysis.taskName || analysis.category || "Job", analysis.date);
        }
        // 3. Save to Google Sheets (New Schema)
        console.log("Saving to Sheets...");
        // Use user-provided assignee/status if available, otherwise fallback to AI/Default
        const finalAssignee = assignee || "Unassigned";
        const finalStatus = status || analysis.status || "Pending";
        await googleService_1.GoogleService.appendToSheet({
            date: analysis.date || new Date().toISOString().split('T')[0],
            taskName: analysis.taskName || "Untitled Task",
            assignee: finalAssignee,
            status: finalStatus,
            description: analysis.description || note,
            cost: analysis.cost || 0,
            imageUrl: imageUrl,
        });
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
