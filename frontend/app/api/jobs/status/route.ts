import { NextRequest, NextResponse } from 'next/server';
import { GoogleService } from '@/lib/services/googleService';
import { ensureConfig, errMsg } from '@/lib/api-utils';

export async function PATCH(req: NextRequest) {
    await ensureConfig();
    try {
        const { id, sheetName, status } = await req.json();
        const result = await GoogleService.updateRowStatus(sheetName, id, status, 'Jobs');
        return NextResponse.json({ status: 'success', data: result });
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}
