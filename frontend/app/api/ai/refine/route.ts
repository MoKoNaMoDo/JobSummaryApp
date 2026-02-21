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
        const lang = language === 'en' ? 'en' : 'th';

        if (!text) {
            return NextResponse.json({ status: 'error', message: 'Text is required' }, { status: 400 });
        }
        if (!['refine', 'expand', 'organize', 'title', 'shorten'].includes(mode)) {
            return NextResponse.json({ status: 'error', message: 'Invalid mode' }, { status: 400 });
        }

        const refined = await GeminiService.refineText(text, mode, lang);
        return NextResponse.json({ status: 'success', data: refined });
    } catch (error: any) {
        let message = error.message || 'Internal Server Error';
        let statusCode = 500;

        if (message.includes('quota') || message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
            message = 'AI Rate limit reached. Please wait a moment and try again.';
            statusCode = 429;
        } else if (message.includes('API key not valid') || message.includes('INVALID_ARGUMENT')) {
            message = 'Invalid AI API Key.';
            statusCode = 401;
        }

        return NextResponse.json({ status: 'error', message }, { status: statusCode });
    }
}
