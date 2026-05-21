import { getSheetsClient, getDriveClient } from '../config/google';
import { ConfigService } from './configService';
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

    private static readonly DEFAULT_FOLDER_ID = "1XxL2DTUzz7MKC3SG417hZ8QZTo9i5JG3";

    static getJobSpreadsheetId(): string {
        const id = ConfigService.get('googleSheetIdJobs');
        if (!id) throw new Error("Google Sheet ID for Jobs is not configured");
        return id;
    }

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

            const newFileResponse = await drive.files.copy({
                fileId: templateId,
                requestBody: {
                    name: `WorkLog_${data.date}_${data.payer}`,
                },
            });
            const newDocId = newFileResponse.data.id;
            if (!newDocId) throw new Error('Failed to copy template');

            return null;

        } catch (error) {
            console.error('Error generating doc:', error);
            return null;
        }
    }

    static async uploadSlip(file: { buffer: Buffer; mimetype: string; originalname?: string }, contextName: string, date: string, prefix: string = "JobSummary"): Promise<string> {
        try {
            let folderId = prefix === "Jobs"
                ? ConfigService.get('googleDriveFolderIdJobs')
                : ConfigService.get('googleDriveFolderId');

            if (!folderId) {
                folderId = ConfigService.get('googleDriveFolderId');
            }

            const proxyUrl = ConfigService.get('googleAppsScriptUrl');

            console.log(`[uploadSlip] folderId=${folderId ? '✅ SET' : '❌ MISSING'} proxyUrl=${proxyUrl ? '✅ SET' : '❌ MISSING'}`);

            if (!folderId) {
                throw new Error('Drive Folder ID ไม่ได้ตั้งค่า — ใส่ใน Settings → Google Drive Folder ID (Jobs)');
            }
            if (!proxyUrl) {
                throw new Error('Apps Script URL ไม่ได้ตั้งค่า — ใส่ใน Settings → Google Apps Script URL');
            }

            const base64Data = file.buffer.toString('base64');
            const fileName = `${date || new Date().toISOString().split('T')[0]}_${contextName || 'Job'}_${Date.now()}.jpg`;

            const payload = {
                base64: base64Data,
                fileName: fileName,
                mimeType: file.mimetype,
                folderId: folderId
            };

            console.log(`[uploadSlip] Sending to proxy: ${(proxyUrl as string).substring(0, 60)}...`);
            const response = await axios.post(proxyUrl as string, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000,
            });

            console.log(`[uploadSlip] Proxy response:`, JSON.stringify(response.data).substring(0, 200));

            if (response.data && response.data.status === 'success') {
                return response.data.url;
            } else {
                throw new Error(response.data?.message || `Proxy error: ${JSON.stringify(response.data)}`);
            }

        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('[uploadSlip] FAILED:', msg);
            return `UPLOAD_FAILED`;
        }
    }

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
            const sheetName = projectSlug ? `${projectSlug}_${monthYear}` : monthYear;

            const spreadsheetId = prefix === "Jobs"
                ? this.getJobSpreadsheetId()
                : ConfigService.get('googleSheetId');

            if (!spreadsheetId) throw new Error(`Google Sheet ID not configured for prefix: ${prefix}`);

            const sheets = getSheetsClient();
            const valueInputOption = 'USER_ENTERED';

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

                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${sheetName}!A1:I1`,
                    valueInputOption,
                    requestBody: {
                        values: [['วันที่', 'ชื่องาน', 'ผู้รับมอบหมาย', 'สถานะ', 'รายละเอียด', 'ค่าใช้จ่าย', 'รูปภาพ', 'อัปเดตล่าสุด', 'วันที่เสร็จ']]
                    }
                });
            }

            const range = `${sheetName}!A:I`;
            const values = [[
                data.date,
                data.taskName,
                data.assignee,
                data.status || 'Pending',
                data.description,
                data.cost || 0,
                data.imageUrl,
                new Date().toLocaleString('th-TH'),
                '', // completedDate — empty on creation
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
            const sheetName = projectSlug ? `${projectSlug}_${monthYear}` : monthYear;

            const spreadsheetId = prefix === "Jobs"
                ? this.getJobSpreadsheetId()
                : ConfigService.get('googleSheetId');
            if (!spreadsheetId) throw new Error("Google Sheet ID not configured");

            const sheets = getSheetsClient();

            const range = `${sheetName}!A:I`;

            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });

            const rows = response.data.values || [];

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
                lastUpdated: row[7] || '',
                completedDate: row[8] || '',
            })).reverse();
        } catch (error) {
            console.error('Error fetching from Sheets:', error);
            return [];
        }
    }

    static async updateRowStatus(sheetName: string, rowIndex: number, status: string, prefix: string = "JobSummary") {
        try {
            const spreadsheetId = prefix === "Jobs"
                ? this.getJobSpreadsheetId()
                : ConfigService.get('googleSheetId');

            if (!spreadsheetId) throw new Error("Google Sheet ID not configured");

            const sheets = getSheetsClient();
            const today = new Date().toISOString().split('T')[0];

            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                requestBody: {
                    valueInputOption: 'USER_ENTERED',
                    data: [
                        { range: `${sheetName}!D${rowIndex}`, values: [[status]] },
                        { range: `${sheetName}!H${rowIndex}`, values: [[new Date().toLocaleString('th-TH')]] },
                        { range: `${sheetName}!I${rowIndex}`, values: [[status === 'Completed' ? today : '']] },
                    ],
                },
            });

            return true;
        } catch (error) {
            console.error('Error updating status:', error);
            throw new Error('Failed to update status');
        }
    }

    static async updateRowData(sheetName: string, rowIndex: number, data: {
        date: string;
        taskName: string;
        assignee: string;
        status: string;
        description: string;
        cost: number;
        completedDate?: string;
    }, prefix: string = "JobSummary") {
        try {
            const spreadsheetId = prefix === "Jobs"
                ? this.getJobSpreadsheetId()
                : ConfigService.get('googleSheetId');

            if (!spreadsheetId) throw new Error("Google Sheet ID not configured");

            const sheets = getSheetsClient();
            const today = new Date().toISOString().split('T')[0];
            const completedDate = data.completedDate ?? (data.status === 'Completed' ? today : '');

            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                requestBody: {
                    valueInputOption: 'USER_ENTERED',
                    data: [
                        {
                            range: `${sheetName}!A${rowIndex}:F${rowIndex}`,
                            values: [[data.date, data.taskName, data.assignee, data.status, data.description, data.cost]],
                        },
                        { range: `${sheetName}!H${rowIndex}`, values: [[new Date().toLocaleString('th-TH')]] },
                        { range: `${sheetName}!I${rowIndex}`, values: [[completedDate]] },
                    ],
                },
            });

            return true;
        } catch (error) {
            console.error('Error updating row data:', error);
            throw new Error('Failed to update row data');
        }
    }

    static async deleteRow(sheetName: string, rowIndex: number, prefix: string = "JobSummary") {
        try {
            const spreadsheetId = prefix === "Jobs"
                ? this.getJobSpreadsheetId()
                : ConfigService.get('googleSheetId');

            if (!spreadsheetId) throw new Error("Google Sheet ID not configured");

            const sheets = getSheetsClient();
            const drive = getDriveClient();

            const range = `${sheetName}!G${rowIndex}`;
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });

            const imageUrl = response.data.values?.[0]?.[0];

            if (imageUrl && imageUrl.includes('drive.google.com')) {
                try {
                    const fileIdMatch = imageUrl.match(/[?&]id=([^&]+)|v?[e]?/)?.[1] || imageUrl.match(/\/d\/([^/]+)/)?.[1] || imageUrl.match(/id=([^&]+)/)?.[1];
                    if (fileIdMatch) {
                        await drive.files.delete({ fileId: fileIdMatch });
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

    // ── Stats: all-time jobs across all month tabs for a project ──────────────
    static async getAllJobsForProject(projectSlug: string) {
        const spreadsheetId = this.getJobSpreadsheetId();
        const sheets = getSheetsClient();

        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetNames = (metadata.data.sheets || [])
            .map(s => s.properties?.title || '')
            .filter(name => name.startsWith(`${projectSlug}_`) && /\d{2}-\d{4}$/.test(name));

        if (sheetNames.length === 0) return [];

        const all = await Promise.all(sheetNames.map(async (sheetName) => {
            try {
                const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!A:I` });
                const rows = res.data.values || [];
                return rows.slice(1).map((row, i) => ({
                    id: i + 2,
                    sheetName,
                    date: row[0] || '',
                    taskName: row[1] || 'Untitled Task',
                    assignee: row[2] || 'Unassigned',
                    status: row[3] || 'Pending',
                    description: row[4] || '',
                    cost: parseFloat(row[5]?.replace(/,/g, '') || '0'),
                    imageUrl: row[6] || '',
                    completedDate: row[8] || '',
                }));
            } catch { return []; }
        }));

        return all.flat();
    }

    // ── Calendar: non-completed jobs from previous months ────────────────────
    static async getOngoingJobsFromPreviousMonths(
        projectSlug: string,
        currentMonth: string,
        currentYear: string,
        lookback = 3
    ) {
        const spreadsheetId = this.getJobSpreadsheetId();
        const sheets = getSheetsClient();

        const sheetNames: string[] = [];
        let m = parseInt(currentMonth);
        let y = parseInt(currentYear);
        for (let i = 0; i < lookback; i++) {
            m--; if (m === 0) { m = 12; y--; }
            sheetNames.push(`${projectSlug}_${String(m).padStart(2, '0')}-${y}`);
        }

        const results = await Promise.all(sheetNames.map(async (sheetName) => {
            try {
                const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!A:I` });
                const rows = res.data.values || [];
                return rows.slice(1)
                    .map((row, i) => ({
                        id: i + 2,
                        sheetName,
                        date: row[0] || '',
                        taskName: row[1] || 'Untitled Task',
                        assignee: row[2] || 'Unassigned',
                        status: row[3] || 'Pending',
                        description: row[4] || '',
                        cost: parseFloat(row[5]?.replace(/,/g, '') || '0'),
                        imageUrl: row[6] || '',
                        completedDate: row[8] || '',
                    }))
                    .filter(job => job.status !== 'Completed');
            } catch { return []; }
        }));

        return results.flat();
    }

    // ── Drag-and-drop: move a job row to a different month tab ────────────────
    static async moveJobToNewMonth(oldSheetName: string, rowIndex: number, newDate: string): Promise<boolean> {
        const spreadsheetId = this.getJobSpreadsheetId();
        const sheets = getSheetsClient();

        // 1. Read current row
        const readRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${oldSheetName}!A${rowIndex}:I${rowIndex}`,
        });
        const row = readRes.data.values?.[0];
        if (!row) throw new Error('Row not found');

        // 2. Build new row with updated date
        const newRow = [
            newDate,
            row[1] || '',
            row[2] || '',
            row[3] || '',
            row[4] || '',
            row[5] || '',
            row[6] || '',
            new Date().toLocaleString('th-TH'),
            row[8] || '',
        ];

        // 3. Determine new sheet name
        const dateObj = new Date(newDate);
        const monthYear = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
        const slugMatch = oldSheetName.match(/^(.+)_\d{2}-\d{4}$/);
        if (!slugMatch) throw new Error('Invalid sheet name format');
        const newSheetName = `${slugMatch[1]}_${monthYear}`;

        // 4. Ensure new sheet exists
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetExists = metadata.data.sheets?.some(s => s.properties?.title === newSheetName);
        if (!sheetExists) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests: [{ addSheet: { properties: { title: newSheetName } } }] },
            });
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${newSheetName}!A1:I1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [['วันที่', 'ชื่องาน', 'ผู้รับมอบหมาย', 'สถานะ', 'รายละเอียด', 'ค่าใช้จ่าย', 'รูปภาพ', 'อัปเดตล่าสุด', 'วันที่เสร็จ']] },
            });
        }

        // 5. Append to new tab
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${newSheetName}!A:I`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [newRow] },
        });

        // 6. Delete row from old tab (no Drive file deletion)
        const oldSheetId = await this.getSheetId(spreadsheetId, oldSheetName);
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: oldSheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex,
                        },
                    },
                }],
            },
        });

        return true;
    }

    static async readTab(spreadsheetId: string, tabName: string): Promise<string[][]> {
        try {
            const sheets = getSheetsClient();
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${tabName}!A:Z`,
            });
            return response.data.values || [];
        } catch (error: unknown) {
            if ((error as { code?: number }).code === 400) return [];
            console.error(`Error reading tab ${tabName}:`, error);
            return [];
        }
    }

    static async writeTab(spreadsheetId: string, tabName: string, rows: string[][]) {
        try {
            const sheets = getSheetsClient();

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

            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: `${tabName}!A:Z`,
            });

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
