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
        const { id } = await params;
        const { name, color } = await req.json();
        const updated = await ProjectService.update(id, { name, color });
        if (!updated) return NextResponse.json({ status: 'error', message: 'Project not found' }, { status: 404 });
        return NextResponse.json({ status: 'success', data: updated });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await ensureConfig();
    try {
        const { id } = await params;
        const ok = await ProjectService.delete(id);
        if (!ok) return NextResponse.json({ status: 'error', message: 'Project not found' }, { status: 404 });
        return NextResponse.json({ status: 'success', message: 'Project deleted' });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
