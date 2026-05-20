"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSheetWithJobHeader = ensureSheetWithJobHeader;
exports.getSheetId = getSheetId;
exports.extractDriveFileId = extractDriveFileId;
const google_1 = require("../../config/google");
async function ensureSheetWithJobHeader(spreadsheetId, sheetName) {
    const sheets = (0, google_1.getSheetsClient)();
    const valueInputOption = 'USER_ENTERED';
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = metadata.data.sheets?.some(s => s.properties?.title === sheetName);
    if (sheetExists)
        return;
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
        range: `${sheetName}!A1:H1`,
        valueInputOption,
        requestBody: {
            values: [['วันที่', 'ชื่องาน', 'ผู้รับมอบหมาย', 'สถานะ', 'รายละเอียด', 'ค่าใช้จ่าย', 'รูปภาพ', 'อัปเดตล่าสุด']]
        }
    });
}
async function getSheetId(spreadsheetId, sheetName) {
    const sheets = (0, google_1.getSheetsClient)();
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = metadata.data.sheets?.find(s => s.properties?.title === sheetName);
    if (!sheet || !sheet.properties?.sheetId)
        throw new Error('Sheet not found');
    return sheet.properties.sheetId;
}
function extractDriveFileId(imageUrl) {
    return imageUrl.match(/[?&]id=([^&]+)/)?.[1]
        || imageUrl.match(/\/d\/([^/]+)/)?.[1]
        || imageUrl.match(/id=([^&]+)/)?.[1];
}
