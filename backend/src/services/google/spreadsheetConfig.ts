import { ConfigService } from '../configService';

export function getJobSpreadsheetId(): string {
    const id = ConfigService.get('googleSheetIdJobs');
    if (!id) throw new Error('Google Sheet ID for Jobs is not configured');
    return id;
}

export function getSpreadsheetId(prefix: string = 'JobSummary'): string | undefined {
    return prefix === 'Jobs'
        ? getJobSpreadsheetId()
        : ConfigService.get('googleSheetId');
}

export function getMonthSheetName(date: string, projectSlug?: string): string {
    const dateObj = new Date(date);
    const yearStr = String(dateObj.getFullYear());
    const monthYear = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${yearStr}`;
    return projectSlug ? `${projectSlug}_${monthYear}` : monthYear;
}

export function getRequestedMonthSheetName(month?: string, year?: string, projectSlug?: string): string {
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

