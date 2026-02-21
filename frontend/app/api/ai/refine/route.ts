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
        console.log(`AI Refine Request: mode=${mode}, lang=${language}, text_len=${text?.length}`);

        const result = await GeminiService.refineText(text, mode, language);

        console.log(`AI Refine Success: result_len=${result?.length}`);
        return NextResponse.json({ status: 'success', data: result });
    } catch (error: any) {
        console.error(`AI Refine Error: ${error.message}`);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
