import { NextRequest, NextResponse } from 'next/server';
import { ConfigService, AppConfig } from '@/lib/services/configService';

let configLoaded = false;
async function ensureConfig() {
    if (!configLoaded) { await ConfigService.load(); configLoaded = true; }
}

export async function GET() {
    await ensureConfig();
    try {
        const config = ConfigService.getConfig();
        const masked = {
            ...config,
            geminiApiKey: config.geminiApiKey ? '********' : '',
            serviceAccountJson: config.serviceAccountJson ? '********' : '',
            users: config.users || [],
        };
        return NextResponse.json({ status: 'success', data: masked });
    } catch {
        return NextResponse.json({ status: 'error', message: 'Failed to retrieve config' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await ensureConfig();
    try {
        const newConfig = await req.json() as AppConfig;
        const current = ConfigService.getConfig();
        const merged: AppConfig = {
            ...current,
            ...newConfig,
            geminiApiKey: (newConfig.geminiApiKey && newConfig.geminiApiKey !== '********') ? newConfig.geminiApiKey : current.geminiApiKey,
            serviceAccountJson: (newConfig.serviceAccountJson && newConfig.serviceAccountJson !== '********') ? newConfig.serviceAccountJson : current.serviceAccountJson,
        };
        const ok = await ConfigService.saveConfig(merged);
        if (ok) return NextResponse.json({ status: 'success', message: 'Configuration updated' });
        return NextResponse.json({ status: 'error', message: 'Failed to save' }, { status: 500 });
    } catch {
        return NextResponse.json({ status: 'error', message: 'Failed to update config' }, { status: 500 });
    }
}
