"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleService = void 0;
const google_1 = require("../config/google");
const configService_1 = require("./configService");
class GoogleService {
    // Helper: Column Mapping
    // A: Date
    // B: Task Name
    // C: Assignee
    // D: Status
    // E: Description
    // F: Cost
    // G: Image
    // H: Last Updated
    // Generate Reimbursement Doc (Legacy/Optional for "Work Log", maybe needed for official reports later)
    static async generateReimbursementDoc(data) {
        try {
            const templateId = configService_1.ConfigService.get('googleDocTemplateId');
            if (!templateId) {
                console.warn('GOOGLE_DOC_TEMPLATE_ID not set, skipping doc generation.');
                return null;
            }
            const drive = (0, google_1.getDriveClient)();
            const docs = (0, google_1.getDocsClient)();
            // 1. Copy Template
            const newFileResponse = await drive.files.copy({
                fileId: templateId,
                requestBody: {
                    name: `WorkLog_${data.date}_${data.payer}`,
                },
            });
            const newDocId = newFileResponse.data.id;
            if (!newDocId)
                throw new Error('Failed to copy template');
            // 2. Prepare Replacements
            // ... (Keeping legacy logic for now, but might not fit new schema perfectly)
            // For now, let's just return null if called, or assume it's rarely used in new flow.
            return null;
        }
        catch (error) {
            console.error('Error generating doc:', error);
            return null;
        }
    }
    // Upload Image to Google Drive
    static async uploadSlip(file, contextName, date) {
        try {
            // Fallback: Direct Drive Upload
            const folderId = configService_1.ConfigService.get('googleDriveFolderId');
            if (folderId) {
                const drive = (0, google_1.getDriveClient)();
                const bufferStream = new (require('stream').PassThrough)();
                bufferStream.end(file.buffer);
                const response = await drive.files.create({
                    requestBody: {
                        name: `${date || new Date().toISOString().split('T')[0]}_${contextName || 'Job'}_${Date.now()}.jpg`,
                        parents: [folderId],
                    },
                    media: {
                        mimeType: file.mimetype,
                        body: bufferStream,
                    },
                    fields: 'id, webViewLink, webContentLink',
                });
                return response.data.webViewLink || '';
            }
            throw new Error('No Upload Method Configured (Drive Folder ID)');
        }
        catch (error) {
            console.error('Error uploading:', error.message);
            return `UPLOAD_FAILED`;
        }
    }
    // Append Row to Google Sheets (NEW SCHEMA)
    static async appendToSheet(data) {
        try {
            const spreadsheetId = configService_1.ConfigService.get('googleSheetId');
            if (!spreadsheetId)
                throw new Error("Google Sheet ID not configured");
            const sheets = (0, google_1.getSheetsClient)();
            const valueInputOption = 'USER_ENTERED';
            const dateObj = new Date(data.date);
            const sheetName = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
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
                        values: [['Date', 'Task Name', 'Assignee', 'Status', 'Description', 'Cost', 'Image', 'Last Updated']]
                    }
                });
            }
            // Append Data
            const range = `${sheetName}!A:H`;
            const values = [[
                    data.date, // A: Date
                    data.taskName, // B: Task Name
                    data.assignee, // C: Assignee
                    data.status || 'Pending', // D: Status
                    data.description, // E: Description
                    data.cost || 0, // F: Cost
                    data.imageUrl, // G: Image
                    new Date().toLocaleString('th-TH') // H: Last Updated
                ]];
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption,
                requestBody: { values },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error appending to Sheets:', error);
            throw new Error('Failed to save data to Google Sheets');
        }
    }
    // Get rows from Sheets (Mapped to New Schema)
    static async getReimbursements(month, year) {
        try {
            const spreadsheetId = configService_1.ConfigService.get('googleSheetId');
            if (!spreadsheetId)
                return [];
            const sheets = (0, google_1.getSheetsClient)();
            let sheetName;
            if (month && year) {
                sheetName = `${month.padStart(2, '0')}-${year}`;
            }
            else {
                const now = new Date();
                sheetName = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
            }
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
        }
        catch (error) {
            console.error('Error fetching from Sheets:', error);
            return [];
        }
    }
    // Update Row Status (Column D)
    static async updateRowStatus(sheetName, rowIndex, status) {
        try {
            const spreadsheetId = configService_1.ConfigService.get('googleSheetId');
            const sheets = (0, google_1.getSheetsClient)();
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
        }
        catch (error) {
            console.error('Error updating status:', error);
            throw new Error('Failed to update status');
        }
    }
    // Update Row Data (Edit)
    static async updateRowData(sheetName, rowIndex, data) {
        try {
            const spreadsheetId = configService_1.ConfigService.get('googleSheetId');
            const sheets = (0, google_1.getSheetsClient)();
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
        }
        catch (error) {
            console.error('Error updating row data:', error);
            throw new Error('Failed to update row data');
        }
    }
    // Delete Row
    static async deleteRow(sheetName, rowIndex) {
        try {
            const spreadsheetId = configService_1.ConfigService.get('googleSheetId');
            const sheets = (0, google_1.getSheetsClient)();
            const drive = (0, google_1.getDriveClient)();
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
                    const fileIdMatch = imageUrl.match(/id=([^&]+)/);
                    if (fileIdMatch && fileIdMatch[1]) {
                        await drive.files.delete({ fileId: fileIdMatch[1] });
                        console.log(`Deleted file ${fileIdMatch[1]} from Drive`);
                    }
                }
                catch (driveError) {
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
                                    sheetId: await GoogleService.getSheetId(spreadsheetId, sheetName),
                                    dimension: 'ROWS',
                                    startIndex: startIndex,
                                    endIndex: startIndex + 1
                                }
                            }
                        }]
                }
            });
            return true;
        }
        catch (error) {
            console.error('Error deleting row:', error);
            throw new Error('Failed to delete row');
        }
    }
    static async getSheetId(spreadsheetId, sheetName) {
        const sheets = (0, google_1.getSheetsClient)();
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = metadata.data.sheets?.find(s => s.properties?.title === sheetName);
        if (!sheet || !sheet.properties?.sheetId)
            throw new Error('Sheet not found');
        return sheet.properties.sheetId;
    }
}
exports.GoogleService = GoogleService;
