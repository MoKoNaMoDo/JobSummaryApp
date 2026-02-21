import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/geminiService';
import { GoogleService } from '@/lib/services/googleService';
import { ConfigService } from '@/lib/services/configService';

// Load config on cold start
let configLoaded = false;
async function ensureConfig() {
    if (!configLoaded) {
        await ConfigService.load();
        configLoaded = true;
    }
}

export async function GET(req: NextRequest) {
    await ensureConfig();
    try {
        const { searchParams } = new URL(req.url);
        const projectSlug = searchParams.get('projectSlug') ?? undefined;
        const jobs = await GoogleService.getReimbursements(undefined, undefined, 'Jobs', projectSlug);
        return NextResponse.json(jobs);
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await ensureConfig();
    try {
        const formData = await req.formData();
        const note = formData.get('note') as string | null;
        const assignee = formData.get('assignee') as string || 'Unassigned';
        const status = formData.get('status') as string || 'Pending';
        const userTaskName = formData.get('taskName') as string | null;
        const projectSlug = formData.get('projectSlug') as string | null;
        const imageFile = formData.get('image') as File | null;

        if (!note && !imageFile) {
            return NextResponse.json({ status: 'error', message: 'Note or Image is required' }, { status: 400 });
        }

        let imageBuffer: Buffer | undefined;
        let imageMimeType: string | undefined;
        if (imageFile) {
            const ab = await imageFile.arrayBuffer();
            imageBuffer = Buffer.from(ab);
            imageMimeType = imageFile.type;
        }

        const analysis = await GeminiService.analyzeJob(note || '', imageBuffer, imageMimeType);

        let imageUrl = '';
        if (imageFile && imageBuffer) {
            const fakeFile = { buffer: imageBuffer, mimetype: imageMimeType!, originalname: imageFile.name, size: imageFile.size, fieldname: 'image', encoding: '7bit', stream: null as any, destination: '', filename: imageFile.name, path: '' };
            imageUrl = await GoogleService.uploadSlip(fakeFile as any, userTaskName || analysis.taskName || 'Job', analysis.date, 'Jobs');
        }

        const finalTaskName = userTaskName || analysis.taskName || 'Untitled Task';
        await GoogleService.appendToSheet({
            date: analysis.date || new Date().toISOString().split('T')[0],
            taskName: finalTaskName,
            assignee,
            status: status || analysis.status || 'Pending',
            description: analysis.description || note || '',
            cost: analysis.cost || 0,
            imageUrl,
        }, 'Jobs', projectSlug ?? undefined);

        return NextResponse.json({ status: 'success', message: 'Job saved successfully', data: { ...analysis, assignee, status, imageUrl } });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    await ensureConfig();
    try {
        const body = await req.json();
        const { id, sheetName, date, taskName, assignee, status, description, cost } = body;
        if (!id || !sheetName) {
            return NextResponse.json({ status: 'error', message: 'Missing id or sheetName' }, { status: 400 });
        }
        await GoogleService.updateRowData(sheetName, Number(id), { date, taskName, assignee, status, description, cost: Number(cost) || 0 }, 'Jobs');
        return NextResponse.json({ status: 'success', message: 'Job updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    await ensureConfig();
    try {
        const body = await req.json();
        const { id, sheetName } = body;
        if (!id || !sheetName) {
            return NextResponse.json({ status: 'error', message: 'Missing id or sheetName' }, { status: 400 });
        }
        await GoogleService.deleteRow(String(sheetName), Number(id), 'Jobs');
        return NextResponse.json({ status: 'success', message: 'Job deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
