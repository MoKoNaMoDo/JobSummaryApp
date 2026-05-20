import { getSheetsClient } from '../../config/google';

export async function readTab(spreadsheetId: string, tabName: string): Promise<string[][]> {
    try {
        const sheets = getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${tabName}!A:Z`,
        });
        return response.data.values || [];
    } catch (error: any) {
        if (error.code === 400) return [];
        console.error(`Error reading tab ${tabName}:`, error);
        return [];
    }
}

export async function writeTab(spreadsheetId: string, tabName: string, rows: string[][]) {
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

