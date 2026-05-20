"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readTab = readTab;
exports.writeTab = writeTab;
const google_1 = require("../../config/google");
async function readTab(spreadsheetId, tabName) {
    try {
        const sheets = (0, google_1.getSheetsClient)();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${tabName}!A:Z`,
        });
        return response.data.values || [];
    }
    catch (error) {
        if (error.code === 400)
            return [];
        console.error(`Error reading tab ${tabName}:`, error);
        return [];
    }
}
async function writeTab(spreadsheetId, tabName, rows) {
    try {
        const sheets = (0, google_1.getSheetsClient)();
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
    }
    catch (error) {
        console.error(`Error writing tab ${tabName}:`, error);
        throw new Error(`Failed to write to system tab ${tabName}`);
    }
}
