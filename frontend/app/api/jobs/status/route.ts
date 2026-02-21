import { NextRequest, NextResponse } from 'next/server';
import { GoogleService } from '@/lib/services/googleService';
import { ConfigService } from '@/lib/services/configService';

let configLoaded = false;
async function ensureConfig() {
    if (!configLoaded) { await ConfigService.load(); configLoaded = true; }
}

// PATCH /api/jobs/status
export async function PATCH(req: NextRequest) {
    await ensureConfig();
    try {
        const { id, sheetName, status } = await req.json();
        if (!id || !sheetName || !status) {
            return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
        }
        await GoogleService.updateRowStatus(sheetName, Number(id), status, 'Jobs');
        return NextResponse.json({ status: 'success', message: 'Status updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
