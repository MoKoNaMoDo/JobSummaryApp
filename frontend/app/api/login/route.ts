import { NextRequest, NextResponse } from 'next/server';
import { ConfigService } from '@/lib/services/configService';

let configLoaded = false;
async function ensureConfig() {
    if (!configLoaded) { await ConfigService.load(); configLoaded = true; }
}

export async function POST(req: NextRequest) {
    await ensureConfig();
    try {
        const { password } = await req.json();
        const stored = ConfigService.get('systemPassword') || '123456';
        if (password === stored) {
            return NextResponse.json({ status: 'success', message: 'Authenticated', token: 'simple-session-token' });
        }
        return NextResponse.json({ status: 'error', message: 'Invalid password' }, { status: 401 });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
