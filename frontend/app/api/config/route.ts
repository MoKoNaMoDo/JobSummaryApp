import { NextRequest, NextResponse } from 'next/server';
import { ConfigService, AppConfig } from '@/lib/services/configService';
import { ensureConfig, errMsg } from '@/lib/api-utils';

export async function GET() {
    await ensureConfig();
    try {
        const safeGet = (key: keyof AppConfig) => {
            const v = ConfigService.get(key);
            return v === 'undefined' || v === 'null' || v == null ? null : v;
        };

        return NextResponse.json({
            status: 'success',
            data: {
                geminiApiKey: safeGet('geminiApiKey') ? 'PRESENT' : 'MISSING',
                groqApiKey: safeGet('groqApiKey') ? 'PRESENT' : 'MISSING',
                serviceAccountJson: safeGet('serviceAccountJson') ? 'PRESENT' : 'MISSING',
                users: safeGet('users') ?? [],
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
