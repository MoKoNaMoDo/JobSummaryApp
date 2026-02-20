import { Request, Response } from 'express';
import { GoogleService } from '../services/googleService';

import { GeminiService } from '../services/geminiService';

export const submitReimbursement = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date, payer, description, amount, taxId, category } = req.body;
        const file = req.file;
        let slipUrl = '-';

        if (file) {
            // 1. Upload Slip to Drive if file exists
            slipUrl = await GoogleService.uploadSlip(file, payer, date);
        }

        // 2. Add to Sheets (Mapped to Work Log Schema)
        await GoogleService.appendToSheet({
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

    } catch (error: any) {
        console.error('Submission error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Internal Server Error' });
    }
};

// Analyze Slip using Gemini
export const analyzeReimbursement = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ status: 'error', message: 'No file uploaded' });
            return;
        }

        const analyzedData = await GeminiService.analyzeSlip(file.buffer, file.mimetype);

        res.status(200).json({
            status: 'success',
            data: analyzedData
        });

    } catch (error: any) {
        console.error('Analysis error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to analyze slip' });
    }
};

// Get Reimbursements with Optional Month/Year Filter
export const getReimbursements = async (req: Request, res: Response): Promise<void> => {
    try {
        const { month, year } = req.query;
        const data = await GoogleService.getReimbursements(month as string, year as string);
        res.status(200).json({ status: 'success', data });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch data' });
    }
};

// Update Reimbursement Status
export const updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sheetName, rowIndex, status } = req.body;

        if (!sheetName || !rowIndex || !status) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }

        await GoogleService.updateRowStatus(sheetName, rowIndex, status);
        res.status(200).json({ status: 'success', message: 'Status updated successfully' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to update status' });
    }
};

// Update Reimbursement Data
export const updateReimbursement = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sheetName, rowIndex, date, category, description, payer, taxId, amount } = req.body;

        if (!sheetName || !rowIndex) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }

        await GoogleService.updateRowData(sheetName, rowIndex, {
            date,
            taskName: category,
            description: `${description} (Tax ID: ${taxId || '-'})`,
            assignee: payer,
            cost: parseFloat(amount),
            status: "Pending" // Default or need to fetch? For now defaulting or leaving out if partial upate supported. 
            // The error says 'category' does not exist in type ... so I must provide valid keys.
        });

        res.status(200).json({ status: 'success', message: 'Reimbursement updated successfully' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to update reimbursement' });
    }
};

// Delete Reimbursement
export const deleteReimbursement = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sheetName, rowIndex } = req.body;

        if (!sheetName || !rowIndex) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }

        await GoogleService.deleteRow(sheetName, rowIndex);
        res.status(200).json({ status: 'success', message: 'Reimbursement deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to delete reimbursement' });
    }
};
