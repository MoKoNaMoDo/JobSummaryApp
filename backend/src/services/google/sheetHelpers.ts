import { getSheetsClient } from '../../config/google';

export async function ensureSheetWithJobHeader(spreadsheetId: string, sheetName: string) {
    const sheets = getSheetsClient();
    const valueInputOption = 'USER_ENTERED';

    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = metadata.data.sheets?.some(s => s.properties?.title === sheetName);

    if (sheetExists) return;

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

export async function getSheetId(spreadsheetId: string, sheetName: string): Promise<number> {
    const sheets = getSheetsClient();
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = metadata.data.sheets?.find(s => s.properties?.title === sheetName);
    if (!sheet || !sheet.properties?.sheetId) throw new Error('Sheet not found');
    return sheet.properties.sheetId;
}

export function extractDriveFileId(imageUrl: string): string | undefined {
    return imageUrl.match(/[?&]id=([^&]+)/)?.[1]
        || imageUrl.match(/\/d\/([^/]+)/)?.[1]
        || imageUrl.match(/id=([^&]+)/)?.[1];
}

