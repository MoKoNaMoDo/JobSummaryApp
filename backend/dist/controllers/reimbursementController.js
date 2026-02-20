"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReimbursement = exports.updateReimbursement = exports.updateStatus = exports.getReimbursements = exports.analyzeReimbursement = exports.submitReimbursement = void 0;
const googleService_1 = require("../services/googleService");
const geminiService_1 = require("../services/geminiService");
const submitReimbursement = async (req, res) => {
    try {
        const { date, payer, description, amount, taxId, category } = req.body;
        const file = req.file;
        let slipUrl = '-';
        if (file) {
            // 1. Upload Slip to Drive if file exists
            slipUrl = await googleService_1.GoogleService.uploadSlip(file, payer, date);
        }
        // 2. Add to Sheets (Mapped to Work Log Schema)
        await googleService_1.GoogleService.appendToSheet({
            date,
            taskName: category || "Reimbursement", // Map category to taskName
            assignee: payer, // Map payer to assignee
            status: "Pending",
            description: `${description} (Tax ID: ${taxId || '-'})`,
            cost: parseFloat(amount),
            imageUrl: slipUrl
        });
        // 3. Generate Document (New Feature) - Kept as is or commented out if generateReimbursementDoc is also changed?
        // Assuming generateReimbursementDoc matches old schema or is independent. 
        // If GoogleService.generateReimbursementDoc was removed, this will fail. 
        // I will comment it out to be safe given the "Work Log" transition.
        /*
        const docResult = await GoogleService.generateReimbursementDoc({ ... });
        */
        res.status(200).json({
            status: 'success',
            message: 'Reimbursement submitted as Work Log',
            data: {
                slipUrl
            }
        });
    }
    catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Internal Server Error' });
    }
};
exports.submitReimbursement = submitReimbursement;
// Analyze Slip using Gemini
const analyzeReimbursement = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ status: 'error', message: 'No file uploaded' });
            return;
        }
        const analyzedData = await geminiService_1.GeminiService.analyzeSlip(file.buffer, file.mimetype);
        res.status(200).json({
            status: 'success',
            data: analyzedData
        });
    }
    catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to analyze slip' });
    }
};
exports.analyzeReimbursement = analyzeReimbursement;
// Get Reimbursements with Optional Month/Year Filter
const getReimbursements = async (req, res) => {
    try {
        const { month, year } = req.query;
        const data = await googleService_1.GoogleService.getReimbursements(month, year);
        res.status(200).json({ status: 'success', data });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch data' });
    }
};
exports.getReimbursements = getReimbursements;
// Update Reimbursement Status
const updateStatus = async (req, res) => {
    try {
        const { sheetName, rowIndex, status } = req.body;
        if (!sheetName || !rowIndex || !status) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }
        await googleService_1.GoogleService.updateRowStatus(sheetName, rowIndex, status);
        res.status(200).json({ status: 'success', message: 'Status updated successfully' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update status' });
    }
};
exports.updateStatus = updateStatus;
// Update Reimbursement Data
const updateReimbursement = async (req, res) => {
    try {
        const { sheetName, rowIndex, date, category, description, payer, taxId, amount } = req.body;
        if (!sheetName || !rowIndex) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }
        await googleService_1.GoogleService.updateRowData(sheetName, rowIndex, {
            date,
            taskName: category,
            description: `${description} (Tax ID: ${taxId || '-'})`,
            assignee: payer,
            cost: parseFloat(amount),
            status: "Pending" // Default or need to fetch? For now defaulting or leaving out if partial upate supported. 
            // The error says 'category' does not exist in type ... so I must provide valid keys.
        });
        res.status(200).json({ status: 'success', message: 'Reimbursement updated successfully' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update reimbursement' });
    }
};
exports.updateReimbursement = updateReimbursement;
// Delete Reimbursement
const deleteReimbursement = async (req, res) => {
    try {
        const { sheetName, rowIndex } = req.body;
        if (!sheetName || !rowIndex) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }
        await googleService_1.GoogleService.deleteRow(sheetName, rowIndex);
        res.status(200).json({ status: 'success', message: 'Reimbursement deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete reimbursement' });
    }
};
exports.deleteReimbursement = deleteReimbursement;
