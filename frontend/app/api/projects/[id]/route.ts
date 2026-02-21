import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/projectService';
import { ConfigService } from '@/lib/services/configService';

let configLoaded = false;
async function ensureConfig() {
    if (!configLoaded) { await ConfigService.load(); configLoaded = true; }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await ensureConfig();
    try {
        const data = await req.json();
        const { id } = await params;
        const result = await ProjectService.update(id, data);
        return NextResponse.json({ status: 'success', data: result });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await ensureConfig();
    try {
        const { id } = await params;
        await ProjectService.delete(id);
        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
