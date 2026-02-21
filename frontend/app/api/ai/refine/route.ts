import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/geminiService';
import { ConfigService } from '@/lib/services/configService';

let configLoaded = false;
async function ensureConfig() {
    if (!configLoaded) { await ConfigService.load(); configLoaded = true; }
}

export async function POST(req: NextRequest) {
    await ensureConfig();
    try {
        const { text, mode, language } = await req.json();
        const result = await GeminiService.refineText(text, mode, language);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
