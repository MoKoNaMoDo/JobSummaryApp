import { NextRequest, NextResponse } from 'next/server';
import { GoogleService } from '@/lib/services/googleService';
import { GeminiService } from '@/lib/services/geminiService';
import { ConfigService } from '@/lib/services/configService';

let configLoaded = false;
async function ensureConfig() {
    if (!configLoaded) { await ConfigService.load(); configLoaded = true; }
}

export async function GET(req: NextRequest) {
    await ensureConfig();
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get('month') || undefined;
        const year = searchParams.get('year') || undefined;
        const projectSlug = searchParams.get('projectSlug') || undefined;
        const jobs = await GoogleService.getReimbursements(month, year, 'Jobs', projectSlug);
        return NextResponse.json(jobs);
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await ensureConfig();
    try {
        const formData = await req.formData();
        const note = formData.get('note') as string;
        const projectSlug = formData.get('projectSlug') as string;
        const file = formData.get('file') as File | null;
        const assignee = formData.get('assignee') as string || 'Unassigned';

        let extractedData: any = {};
        let imageUrl = '';

        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            imageUrl = await GoogleService.uploadSlip({
                buffer,
                mimetype: file.type,
                originalname: file.name
            }, projectSlug || 'Job', '', 'Jobs');
            extractedData = await GeminiService.analyzeJob(note, buffer, file.type);
        } else {
            extractedData = await GeminiService.analyzeJob(note);
        }

        const jobEntry = {
            date: extractedData.date || new Date().toISOString().split('T')[0],
            taskName: extractedData.taskName || note.substring(0, 30),
            assignee: assignee,
            status: extractedData.status || 'Pending',
            description: extractedData.description || note,
            cost: extractedData.cost || 0,
            imageUrl: imageUrl
        };

        const result = await GoogleService.appendToSheet(jobEntry, 'Jobs', projectSlug);
        return NextResponse.json({ status: 'success', data: result });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    await ensureConfig();
    try {
        const data = await req.json();
        const { sheetName, id, ...updateData } = data;
        const result = await GoogleService.updateRowData(sheetName, id, updateData as any, 'Jobs');
        return NextResponse.json({ status: 'success', data: result });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    await ensureConfig();
    try {
        const { id, sheetName } = await req.json();
        const result = await GoogleService.deleteRow(sheetName, id, 'Jobs');
        return NextResponse.json({ status: 'success', data: result });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
