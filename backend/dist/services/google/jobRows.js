"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendToSheet = appendToSheet;
exports.getReimbursements = getReimbursements;
exports.updateRowStatus = updateRowStatus;
exports.updateRowData = updateRowData;
exports.deleteRow = deleteRow;
const google_1 = require("../../config/google");
const spreadsheetConfig_1 = require("./spreadsheetConfig");
const sheetHelpers_1 = require("./sheetHelpers");
async function appendToSheet(data, prefix = 'JobSummary', projectSlug) {
    try {
        const sheetName = (0, spreadsheetConfig_1.getMonthSheetName)(data.date, projectSlug);
        const spreadsheetId = (0, spreadsheetConfig_1.getSpreadsheetId)(prefix);
        if (!spreadsheetId)
            throw new Error(`Google Sheet ID not configured for prefix: ${prefix}`);
        const sheets = (0, google_1.getSheetsClient)();
        await (0, sheetHelpers_1.ensureSheetWithJobHeader)(spreadsheetId, sheetName);
        const values = [[
                data.date,
                data.taskName,
                data.assignee,
                data.status || 'Pending',
                data.description,
                data.cost || 0,
                data.imageUrl,
                new Date().toLocaleString('th-TH')
            ]];
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A:H`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error appending to Sheets:', error);
        throw new Error('Failed to save data to Google Sheets');
    }
}
async function getReimbursements(month, year, prefix = 'JobSummary', projectSlug) {
    try {
        const sheetName = (0, spreadsheetConfig_1.getRequestedMonthSheetName)(month, year, projectSlug);
        const spreadsheetId = (0, spreadsheetConfig_1.getSpreadsheetId)(prefix);
        if (!spreadsheetId)
            throw new Error('Google Sheet ID not configured');
        const sheets = (0, google_1.getSheetsClient)();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:H`,
        });
        const rows = response.data.values || [];
        return rows.slice(1).map((row, index) => ({
            id: index + 2,
            sheetName,
            date: row[0] || '',
            taskName: row[1] || 'Untitled Task',
            assignee: row[2] || 'Unassigned',
            status: row[3] || 'Pending',
            description: row[4] || '',
            cost: parseFloat(row[5]?.replace(/,/g, '') || '0'),
            imageUrl: row[6] || '',
            lastUpdated: row[7] || ''
        })).reverse();
    }
    catch (error) {
        console.error('Error fetching from Sheets:', error);
        return [];
    }
}
async function updateRowStatus(sheetName, rowIndex, status, prefix = 'JobSummary') {
    try {
        const spreadsheetId = (0, spreadsheetConfig_1.getSpreadsheetId)(prefix);
        if (!spreadsheetId)
            throw new Error('Google Sheet ID not configured');
        const sheets = (0, google_1.getSheetsClient)();
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!D${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[status]] }
        });
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
async function updateRowData(sheetName, rowIndex, data, prefix = 'JobSummary') {
    try {
        const spreadsheetId = (0, spreadsheetConfig_1.getSpreadsheetId)(prefix);
        if (!spreadsheetId)
            throw new Error('Google Sheet ID not configured');
        const sheets = (0, google_1.getSheetsClient)();
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
            range: `${sheetName}!A${rowIndex}:F${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values }
        });
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
async function deleteRow(sheetName, rowIndex, prefix = 'JobSummary') {
    try {
        const spreadsheetId = (0, spreadsheetConfig_1.getSpreadsheetId)(prefix);
        if (!spreadsheetId)
            throw new Error('Google Sheet ID not configured');
        const sheets = (0, google_1.getSheetsClient)();
        const drive = (0, google_1.getDriveClient)();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!G${rowIndex}`,
        });
        const imageUrl = response.data.values?.[0]?.[0];
        if (imageUrl && imageUrl.includes('drive.google.com')) {
            try {
                const fileId = (0, sheetHelpers_1.extractDriveFileId)(imageUrl);
                if (fileId) {
                    await drive.files.delete({ fileId });
                    console.log(`Deleted file ${fileId} from Drive`);
                }
                else {
                    console.log('Could not extract file ID from URL:', imageUrl);
                }
            }
            catch (driveError) {
                console.error('Error deleting file from Drive:', driveError);
            }
        }
        const startIndex = rowIndex - 1;
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: await (0, sheetHelpers_1.getSheetId)(spreadsheetId, sheetName),
                                dimension: 'ROWS',
                                startIndex,
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
