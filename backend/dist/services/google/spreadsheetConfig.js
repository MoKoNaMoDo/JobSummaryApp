"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobSpreadsheetId = getJobSpreadsheetId;
exports.getSpreadsheetId = getSpreadsheetId;
exports.getMonthSheetName = getMonthSheetName;
exports.getRequestedMonthSheetName = getRequestedMonthSheetName;
const configService_1 = require("../configService");
function getJobSpreadsheetId() {
    const id = configService_1.ConfigService.get('googleSheetIdJobs');
    if (!id)
        throw new Error('Google Sheet ID for Jobs is not configured');
    return id;
}
function getSpreadsheetId(prefix = 'JobSummary') {
    return prefix === 'Jobs'
        ? getJobSpreadsheetId()
        : configService_1.ConfigService.get('googleSheetId');
}
function getMonthSheetName(date, projectSlug) {
    const dateObj = new Date(date);
    const yearStr = String(dateObj.getFullYear());
    const monthYear = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${yearStr}`;
    return projectSlug ? `${projectSlug}_${monthYear}` : monthYear;
}
function getRequestedMonthSheetName(month, year, projectSlug) {
    let targetMonth = month;
    let targetYear = year;
    if (!targetMonth || !targetYear) {
        const now = new Date();
        targetMonth = String(now.getMonth() + 1).padStart(2, '0');
        targetYear = String(now.getFullYear());
    }
    const monthYear = `${targetMonth}-${targetYear}`;
    return projectSlug ? `${projectSlug}_${monthYear}` : monthYear;
}
