import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/geminiService';
import { ensureConfig, errMsg } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
    await ensureConfig();
    try {
        const { text, mode, language } = await req.json();
        const result = await GeminiService.refineText(text, mode, language);
        return NextResponse.json({ status: 'success', data: result });
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}
