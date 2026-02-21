import { NextRequest, NextResponse } from 'next/server';
import { ConfigService } from '@/lib/services/configService';

let configLoaded = false;
async function ensureConfig() {
    if (!configLoaded) { await ConfigService.load(); configLoaded = true; }
}

export async function GET() {
    await ensureConfig();
    try {
        const config = ConfigService.getConfig();
        return NextResponse.json({
            status: 'success',
            data: {
                geminiApiKey: config.geminiApiKey || '',
                serviceAccountJson: config.serviceAccountJson ? 'PRESENT (HIDDEN)' : '',
                users: config.users || []
            }
        });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await ensureConfig();
    try {
        const newConfig = await req.json();
        const success = await ConfigService.saveConfig(newConfig);
        return NextResponse.json({ status: success ? 'success' : 'error' });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
