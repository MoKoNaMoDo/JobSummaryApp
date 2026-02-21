import { NextRequest, NextResponse } from 'next/server';
import { ConfigService, AppConfig } from '@/lib/services/configService';

let configLoaded = false;
async function ensureConfig() {
    if (!configLoaded) { await ConfigService.load(); configLoaded = true; }
}

export async function GET() {
    await ensureConfig();
    try {
        // Helper function to get config value and handle "undefined" or "null" strings
        const getConfigValue = (key: string) => {
            const value = ConfigService.get(key as keyof AppConfig);
            // Treat string "undefined" or "null" as truly missing
            if (value === "undefined" || value === "null" || value === undefined || value === null) {
                return null;
            }
            return value;
        };

        return NextResponse.json({
            status: 'success',
            data: {
                geminiApiKey: getConfigValue('geminiApiKey') ? 'PRESENT' : 'MISSING',
                groqApiKey: getConfigValue('groqApiKey') ? 'PRESENT' : 'MISSING',
                serviceAccountJson: getConfigValue('serviceAccountJson') ? 'PRESENT' : 'MISSING',
                users: getConfigValue('users') || []
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
