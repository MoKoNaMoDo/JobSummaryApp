import { NextRequest, NextResponse } from 'next/server';
import { GoogleService } from '@/lib/services/googleService';
import { ConfigService } from '@/lib/services/configService';

let configLoaded = false;
async function ensureConfig() {
    if (!configLoaded) { await ConfigService.load(); configLoaded = true; }
}

export async function PATCH(req: NextRequest) {
    await ensureConfig();
    try {
        const { id, sheetName, status } = await req.json();
        const result = await GoogleService.updateRowStatus(sheetName, id, status, 'Jobs');
        return NextResponse.json({ status: 'success', data: result });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
