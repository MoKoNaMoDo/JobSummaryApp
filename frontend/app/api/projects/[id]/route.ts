import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/projectService';
import { ensureConfig, errMsg } from '@/lib/api-utils';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await ensureConfig();
    try {
        const data = await req.json();
        const { id } = await params;
        const result = await ProjectService.update(id, data);
        return NextResponse.json({ status: 'success', data: result });
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await ensureConfig();
    try {
        const { id } = await params;
        await ProjectService.delete(id);
        return NextResponse.json({ status: 'success' });
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}
