import { NextRequest, NextResponse } from 'next/server';
import { ConfigService, AppConfig } from '@/lib/services/configService';
import { ensureConfig, errMsg } from '@/lib/api-utils';

export async function GET() {
    await ensureConfig();
    try {
        const get = (key: keyof AppConfig) => {
            const v = ConfigService.get(key);
            if (v === 'undefined' || v === 'null' || v == null) return '';
            return v;
        };
        const masked = (key: keyof AppConfig) => get(key) ? '********' : '';

        return NextResponse.json({
            status: 'success',
            data: {
                // Sensitive — return masked value so UI shows "already set"
                geminiApiKey: masked('geminiApiKey'),
                groqApiKey: masked('groqApiKey'),
                serviceAccountJson: masked('serviceAccountJson'),
                // Non-sensitive — return actual values for editing
                googleSheetId: get('googleSheetId'),
                googleSheetIdJobs: get('googleSheetIdJobs'),
                googleDriveFolderId: get('googleDriveFolderId'),
                googleDriveFolderIdJobs: get('googleDriveFolderIdJobs'),
                googleAppsScriptUrl: get('googleAppsScriptUrl'),
                users: get('users') || [],
            },
        });
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await ensureConfig();
    try {
        const newConfig = await req.json();
        const success = await ConfigService.saveConfig(newConfig);
        return NextResponse.json({ status: success ? 'success' : 'error' });
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}
