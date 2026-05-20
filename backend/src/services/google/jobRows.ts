import { getDriveClient, getSheetsClient } from '../../config/google';
import { getMonthSheetName, getRequestedMonthSheetName, getSpreadsheetId } from './spreadsheetConfig';
import { ensureSheetWithJobHeader, extractDriveFileId, getSheetId } from './sheetHelpers';
import type { SheetJobEntry, SheetJobUpdate } from './types';

export async function appendToSheet(data: SheetJobEntry, prefix: string = 'JobSummary', projectSlug?: string) {
    try {
        const sheetName = getMonthSheetName(data.date, projectSlug);
        const spreadsheetId = getSpreadsheetId(prefix);

        if (!spreadsheetId) throw new Error(`Google Sheet ID not configured for prefix: ${prefix}`);

        const sheets = getSheetsClient();
        await ensureSheetWithJobHeader(spreadsheetId, sheetName);

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
    } catch (error) {
        console.error('Error appending to Sheets:', error);
        throw new Error('Failed to save data to Google Sheets');
    }
}

export async function getReimbursements(month?: string, year?: string, prefix: string = 'JobSummary', projectSlug?: string) {
    try {
        const sheetName = getRequestedMonthSheetName(month, year, projectSlug);
        const spreadsheetId = getSpreadsheetId(prefix);
        if (!spreadsheetId) throw new Error('Google Sheet ID not configured');

        const sheets = getSheetsClient();
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
    } catch (error) {
        console.error('Error fetching from Sheets:', error);
        return [];
    }
}

export async function updateRowStatus(sheetName: string, rowIndex: number, status: string, prefix: string = 'JobSummary') {
    try {
        const spreadsheetId = getSpreadsheetId(prefix);
        if (!spreadsheetId) throw new Error('Google Sheet ID not configured');

        const sheets = getSheetsClient();

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
    } catch (error) {
        console.error('Error updating status:', error);
        throw new Error('Failed to update status');
    }
}

export async function updateRowData(sheetName: string, rowIndex: number, data: SheetJobUpdate, prefix: string = 'JobSummary') {
    try {
        const spreadsheetId = getSpreadsheetId(prefix);
        if (!spreadsheetId) throw new Error('Google Sheet ID not configured');

        const sheets = getSheetsClient();
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
    } catch (error) {
        console.error('Error updating row data:', error);
        throw new Error('Failed to update row data');
    }
}

export async function deleteRow(sheetName: string, rowIndex: number, prefix: string = 'JobSummary') {
    try {
        const spreadsheetId = getSpreadsheetId(prefix);
        if (!spreadsheetId) throw new Error('Google Sheet ID not configured');

        const sheets = getSheetsClient();
        const drive = getDriveClient();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!G${rowIndex}`,
        });

        const imageUrl = response.data.values?.[0]?.[0];

        if (imageUrl && imageUrl.includes('drive.google.com')) {
            try {
                const fileId = extractDriveFileId(imageUrl);
                if (fileId) {
                    await drive.files.delete({ fileId });
                    console.log(`Deleted file ${fileId} from Drive`);
                } else {
                    console.log('Could not extract file ID from URL:', imageUrl);
                }
            } catch (driveError) {
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
                            sheetId: await getSheetId(spreadsheetId, sheetName),
                            dimension: 'ROWS',
                            startIndex,
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

