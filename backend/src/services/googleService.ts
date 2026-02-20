import { getSheetsClient, getDriveClient, getDocsClient } from '../config/google';
import { ConfigService } from './configService';
import THBText from 'thai-baht-text';
import axios from 'axios';

export class GoogleService {

    // Helper: Column Mapping
    // A: Date
    // B: Task Name
    // C: Assignee
    // D: Status
    // E: Description
    // F: Cost
    // G: Image
    // H: Last Updated

    // System Setting Fallbacks
    private static readonly DEFAULT_FOLDER_ID = "1XxL2DTUzz7MKC3SG417hZ8QZTo9i5JG3";

    /**
     * Resolves the correct Spreadsheet ID for Jobs based on Config.
     */
    static getJobSpreadsheetId(): string {
        const id = ConfigService.get('googleSheetIdJobs');
        if (!id) throw new Error("Google Sheet ID for Jobs is not configured");
        return id;
    }


    // Generate Reimbursement Doc (Legacy/Optional for "Work Log", maybe needed for official reports later)
    static async generateReimbursementDoc(data: {
        date: string;
        payer: string;
        category: string;
        description: string;
        amount: number;
        taxId?: string;
        slipUrl?: string;
    }) {
        try {
            const templateId = ConfigService.get('googleDocTemplateId');
            if (!templateId) {
                console.warn('GOOGLE_DOC_TEMPLATE_ID not set, skipping doc generation.');
                return null;
            }

            const drive = getDriveClient();
            const docs = getDocsClient();

            // 1. Copy Template
            const newFileResponse = await drive.files.copy({
                fileId: templateId,
                requestBody: {
                    name: `WorkLog_${data.date}_${data.payer}`,
                },
            });
            const newDocId = newFileResponse.data.id;
            if (!newDocId) throw new Error('Failed to copy template');

            // 2. Prepare Replacements
            // ... (Keeping legacy logic for now, but might not fit new schema perfectly)
            // For now, let's just return null if called, or assume it's rarely used in new flow.
            return null;

        } catch (error) {
            console.error('Error generating doc:', error);
            return null;
        }
    }

    // Upload Image to Google Drive via Apps Script Proxy
    static async uploadSlip(file: Express.Multer.File, contextName: string, date: string, prefix: string = "JobSummary"): Promise<string> {
        try {
            // Determine target Folder ID based on context
            let folderId = prefix === "Jobs"
                ? ConfigService.get('googleDriveFolderIdJobs')
                : ConfigService.get('googleDriveFolderId');

            // Fallback to the legacy folder if the specific Job one isn't set yet
            if (!folderId) {
                folderId = ConfigService.get('googleDriveFolderId');
            }

            // Target Apps Script URL (Fallback to the one explicitly tested by the user)
            const proxyUrl = ConfigService.get('googleAppsScriptUrl') || "https://script.google.com/macros/s/AKfycbzZK2kRgPLXTb0LPn7Lsv2vfbfGeN2gPs5ZAfkAE5fbCr7Erij57HgqGWnqbAsK3VObYg/exec";

            if (folderId && proxyUrl) {
                const base64Data = file.buffer.toString('base64');
                const fileName = `${date || new Date().toISOString().split('T')[0]}_${contextName || 'Job'}_${Date.now()}.jpg`;

                const payload = {
                    base64: base64Data,
                    fileName: fileName,
                    mimeType: file.mimetype,
                    folderId: folderId
                };

                const response = await axios.post(proxyUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data && response.data.status === 'success') {
                    return response.data.url;
                } else {
                    throw new Error(response.data?.message || 'Proxy returned an error');
                }
            }

            throw new Error('No Upload Method Configured (Drive Folder ID or Proxy URL)');

        } catch (error: any) {
            console.error('Error uploading via Proxy:', error.message);
            return `UPLOAD_FAILED`;
        }
    }

    // Append Row to Google Sheets (NEW SCHEMA)
    static async appendToSheet(data: {
        date: string;
        taskName: string;
        assignee: string;
        status: string;
        description: string;
        cost: number;
        imageUrl: string;
    }, prefix: string = "JobSummary", projectSlug?: string) {
        try {
            const dateObj = new Date(data.date);
            const yearStr = String(dateObj.getFullYear());
            const monthYear = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${yearStr}`;
            const sheetName = projectSlug ? `${projectSlug}_${monthYear}` : monthYear; // e.g. building-a_02-2026

            // Determine target Spreadsheet ID based on context
            const spreadsheetId = prefix === "Jobs"
                ? this.getJobSpreadsheetId()
                : ConfigService.get('googleSheetId');

            if (!spreadsheetId) throw new Error(`Google Sheet ID not configured for prefix: ${prefix}`);

            const sheets = getSheetsClient();
            const valueInputOption = 'USER_ENTERED';

            // Check if Sheet exists
            const metadata = await sheets.spreadsheets.get({ spreadsheetId });
            const sheetExists = metadata.data.sheets?.some(s => s.properties?.title === sheetName);

            if (!sheetExists) {
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [{
                            addSheet: { properties: { title: sheetName } }
                        }]
                    }
                });

                // Set Header automatically (New Schema)
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${sheetName}!A1:H1`,
                    valueInputOption,
                    requestBody: {
                        values: [['วันที่', 'ชื่องาน', 'ผู้รับมอบหมาย', 'สถานะ', 'รายละเอียด', 'ค่าใช้จ่าย', 'รูปภาพ', 'อัปเดตล่าสุด']]
                    }
                });
            }

            // Append Data
            const range = `${sheetName}!A:H`;
            const values = [[
                data.date,             // A: Date
                data.taskName,         // B: Task Name
                data.assignee,         // C: Assignee
                data.status || 'Pending', // D: Status
                data.description,      // E: Description
                data.cost || 0,        // F: Cost
                data.imageUrl,         // G: Image
                new Date().toLocaleString('th-TH') // H: Last Updated
            ]];

            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption,
                requestBody: { values },
            });

            return response.data;
        } catch (error) {
            console.error('Error appending to Sheets:', error);
            throw new Error('Failed to save data to Google Sheets');
        }
    }

    // Get rows from Sheets (Mapped to New Schema)
    static async getReimbursements(month?: string, year?: string, prefix: string = "JobSummary", projectSlug?: string) {
        try {
            let targetMonth = month;
            let targetYear = year;

            if (!targetMonth || !targetYear) {
                const now = new Date();
                targetMonth = String(now.getMonth() + 1).padStart(2, '0');
                targetYear = String(now.getFullYear());
            }

            const monthYear = `${targetMonth}-${targetYear}`;
            const sheetName = projectSlug ? `${projectSlug}_${monthYear}` : monthYear; // e.g. building-a_02-2026

            // Determine target Spreadsheet ID based on context
            const spreadsheetId = prefix === "Jobs"
                ? this.getJobSpreadsheetId()
                : ConfigService.get('googleSheetId');
            if (!spreadsheetId) throw new Error("Google Sheet ID not configured");

            const sheets = getSheetsClient();

            const range = `${sheetName}!A:H`;

            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });

            const rows = response.data.values || [];

            // Skip header (row 0)
            return rows.slice(1).map((row, index) => ({
                id: index + 2,
                sheetName: sheetName,
                date: row[0] || '',
                taskName: row[1] || 'Untitled Task',
                assignee: row[2] || 'Unassigned',
                status: row[3] || 'Pending',
                description: row[4] || '',
                cost: parseFloat(row[5]?.replace(/,/g, '') || '0'),
                imageUrl: row[6] || '',
                lastUpdated: row[7] || ''
            })).reverse(); // Show newest first? Or maybe let frontend sort.
        } catch (error) {
            console.error('Error fetching from Sheets:', error);
            return [];
        }
    }

    // Update Row Status (Column D)
    static async updateRowStatus(sheetName: string, rowIndex: number, status: string, prefix: string = "JobSummary") {
        try {
            // Determine target Spreadsheet ID based on context
            const spreadsheetId = prefix === "Jobs"
                ? this.getJobSpreadsheetId()
                : ConfigService.get('googleSheetId');

            if (!spreadsheetId) throw new Error("Google Sheet ID not configured");

            const sheets = getSheetsClient();
            const range = `${sheetName}!D${rowIndex}`; // Column D is Status

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[status]] }
            });

            // Also update timestamp in H
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!H${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[new Date().toLocaleString('th-TH')]] }
            });

            return true;
        } catch (error) {
            console.error('Error updating status:', error);
            throw new Error('Failed to update status');
        }
    }

    // Update Row Data (Edit)
    static async updateRowData(sheetName: string, rowIndex: number, data: {
        date: string;
        taskName: string;
        assignee: string;
        status: string;
        description: string;
        cost: number;
    }, prefix: string = "JobSummary") {
        try {
            const spreadsheetId = prefix === "Jobs"
                ? this.getJobSpreadsheetId()
                : ConfigService.get('googleSheetId');

            if (!spreadsheetId) throw new Error("Google Sheet ID not configured");

            const sheets = getSheetsClient();

            // Update A (Date) to F (Cost)
            // A: Date, B: Task, C: Assignee, D: Status, E: Descr, F: Cost
            const range = `${sheetName}!A${rowIndex}:F${rowIndex}`;

            const values = [[
                data.date,
                data.taskName,
                data.assignee,
                data.status,
                data.description,
                data.cost
            ]];

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values }
            });

            // Also update timestamp in H
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!H${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[new Date().toLocaleString('th-TH')]] }
            });

            return true;
        } catch (error) {
            console.error('Error updating row data:', error);
            throw new Error('Failed to update row data');
        }
    }

    // Delete Row
    static async deleteRow(sheetName: string, rowIndex: number, prefix: string = "JobSummary") {
        try {
            const spreadsheetId = prefix === "Jobs"
                ? this.getJobSpreadsheetId()
                : ConfigService.get('googleSheetId');

            if (!spreadsheetId) throw new Error("Google Sheet ID not configured");

            const sheets = getSheetsClient();
            const drive = getDriveClient();

            // 1. Get Image URL (Column G)
            const range = `${sheetName}!G${rowIndex}`;
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });

            const imageUrl = response.data.values?.[0]?.[0];

            // 2. Delete from Drive
            if (imageUrl && imageUrl.includes('drive.google.com')) {
                try {
                    // Match ?id=ID or /d/ID/view
                    const fileIdMatch = imageUrl.match(/[?&]id=([^&]+)|v?[e]?/)?.[1] || imageUrl.match(/\/d\/([^/]+)/)?.[1] || imageUrl.match(/id=([^&]+)/)?.[1];
                    if (fileIdMatch) {
                        await drive.files.delete({ fileId: fileIdMatch });
                        console.log(`Deleted file ${fileIdMatch} from Drive`);
                    } else {
                        console.log('Could not extract file ID from URL:', imageUrl);
                    }
                } catch (driveError) {
                    console.error('Error deleting file from Drive:', driveError);
                }
            }

            // 3. Delete from Sheet
            const startIndex = rowIndex - 1;
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: await GoogleService.getSheetId(spreadsheetId!, sheetName),
                                dimension: 'ROWS',
                                startIndex: startIndex,
                                endIndex: startIndex + 1
                            }
                        }
                    }]
                }
            });
            return true;
        } catch (error) {
            console.error('Error deleting row:', error);
            throw new Error('Failed to delete row');
        }
    }

    private static async getSheetId(spreadsheetId: string, sheetName: string): Promise<number> {
        const sheets = getSheetsClient();
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = metadata.data.sheets?.find(s => s.properties?.title === sheetName);
        if (!sheet || !sheet.properties?.sheetId) throw new Error('Sheet not found');
        return sheet.properties.sheetId;
    }

    // --- NEW: Generic Metadata Support ---

    /**
     * Reads all rows from a specific tab.
     */
    static async readTab(spreadsheetId: string, tabName: string): Promise<string[][]> {
        try {
            const sheets = getSheetsClient();
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${tabName}!A:Z`,
            });
            return response.data.values || [];
        } catch (error: any) {
            // If tab doesn't exist, return empty
            if (error.code === 400) return [];
            console.error(`Error reading tab ${tabName}:`, error);
            return [];
        }
    }

    /**
     * Overwrites a tab with new data. Creates it if it doesn't exist.
     */
    static async writeTab(spreadsheetId: string, tabName: string, rows: string[][]) {
        try {
            const sheets = getSheetsClient();

            // 1. Check if Sheet exists
            const metadata = await sheets.spreadsheets.get({ spreadsheetId });
            const sheetExists = metadata.data.sheets?.some(s => s.properties?.title === tabName);

            if (!sheetExists) {
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [{
                            addSheet: { properties: { title: tabName } }
                        }]
                    }
                });
            }

            // 2. Clear existing content
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: `${tabName}!A:Z`,
            });

            // 3. Update with new rows
            if (rows.length > 0) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${tabName}!A1`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: rows }
                });
            }
            return true;
        } catch (error) {
            console.error(`Error writing tab ${tabName}:`, error);
            throw new Error(`Failed to write to system tab ${tabName}`);
        }
    }
}
