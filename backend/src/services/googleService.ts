import { generateReimbursementDoc } from './google/docs';
import { uploadSlip } from './google/driveUpload';
import { appendToSheet, deleteRow, getReimbursements, updateRowData, updateRowStatus } from './google/jobRows';
import { getJobSpreadsheetId } from './google/spreadsheetConfig';
import { readTab, writeTab } from './google/sheetTabs';
import type { ReimbursementDocInput, SheetJobEntry, SheetJobUpdate } from './google/types';

export class GoogleService {
    static getJobSpreadsheetId(): string {
        return getJobSpreadsheetId();
    }

    static async generateReimbursementDoc(data: ReimbursementDocInput) {
        return generateReimbursementDoc(data);
    }

    static async uploadSlip(file: Express.Multer.File, contextName: string, date: string, prefix: string = 'JobSummary'): Promise<string> {
        return uploadSlip(file, contextName, date, prefix);
    }

    static async appendToSheet(data: SheetJobEntry, prefix: string = 'JobSummary', projectSlug?: string) {
        return appendToSheet(data, prefix, projectSlug);
    }

    static async getReimbursements(month?: string, year?: string, prefix: string = 'JobSummary', projectSlug?: string) {
        return getReimbursements(month, year, prefix, projectSlug);
    }

    static async updateRowStatus(sheetName: string, rowIndex: number, status: string, prefix: string = 'JobSummary') {
        return updateRowStatus(sheetName, rowIndex, status, prefix);
    }

    static async updateRowData(sheetName: string, rowIndex: number, data: SheetJobUpdate, prefix: string = 'JobSummary') {
        return updateRowData(sheetName, rowIndex, data, prefix);
    }

    static async deleteRow(sheetName: string, rowIndex: number, prefix: string = 'JobSummary') {
        return deleteRow(sheetName, rowIndex, prefix);
    }

    static async readTab(spreadsheetId: string, tabName: string): Promise<string[][]> {
        return readTab(spreadsheetId, tabName);
    }

    static async writeTab(spreadsheetId: string, tabName: string, rows: string[][]) {
        return writeTab(spreadsheetId, tabName, rows);
    }
}

