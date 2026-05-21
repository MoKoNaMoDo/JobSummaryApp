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
        const msg = errMsg(error);
        console.error('[/api/ai/refine] Error:', msg);
        // API key missing → 400 with actionable message
        if (msg.includes('missing') || msg.includes('API Key')) {
            return NextResponse.json({ status: 'error', message: 'Groq API Key ไม่ได้ตั้งค่า — กรุณา restart dev server หรือใส่ key ในหน้าตั้งค่า' }, { status: 400 });
        }
        return NextResponse.json({ status: 'error', message: msg }, { status: 500 });
    }
}
