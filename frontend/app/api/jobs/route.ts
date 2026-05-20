import { NextRequest, NextResponse } from 'next/server';
import { GoogleService } from '@/lib/services/googleService';
import { GeminiService } from '@/lib/services/geminiService';
import { ensureConfig, errMsg } from '@/lib/api-utils';

interface ExtractedJobData {
    date?: string;
    taskName?: string;
    status?: string;
    description?: string;
    cost?: number;
}

export async function GET(req: NextRequest) {
    await ensureConfig();
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get('month') ?? undefined;
        const year = searchParams.get('year') ?? undefined;
        const projectSlug = searchParams.get('projectSlug') ?? undefined;
        const jobs = await GoogleService.getReimbursements(month, year, 'Jobs', projectSlug);
        return NextResponse.json(jobs);
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await ensureConfig();
    try {
        const formData = await req.formData();
        const note = formData.get('note') as string;
        const projectSlug = formData.get('projectSlug') as string;
        const file = formData.get('file') as File | null;
        const assignee = (formData.get('assignee') as string) || 'Unassigned';
        const taskName = formData.get('taskName') as string | null;
        const workDate = formData.get('workDate') as string | null;
        const status = formData.get('status') as string | null;

        let extractedData: ExtractedJobData = {};
        let imageUrl = '';

        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            imageUrl = await GoogleService.uploadSlip(
                { buffer, mimetype: file.type, originalname: file.name },
                projectSlug || 'Job',
                '',
                'Jobs',
            );
            extractedData = await GeminiService.analyzeJob(note, buffer, file.type);
        } else {
            extractedData = await GeminiService.analyzeJob(note);
        }

        const jobEntry = {
            date: workDate ?? extractedData.date ?? new Date().toISOString().split('T')[0],
            taskName: taskName ?? extractedData.taskName ?? note.substring(0, 30),
            assignee,
            status: status ?? extractedData.status ?? 'Pending',
            description: extractedData.description ?? note,
            cost: extractedData.cost ?? 0,
            imageUrl,
        };

        const result = await GoogleService.appendToSheet(jobEntry, 'Jobs', projectSlug);
        return NextResponse.json({ status: 'success', data: result });
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    await ensureConfig();
    try {
        const data = await req.json();
        const { sheetName, id, ...updateData } = data;
        const result = await GoogleService.updateRowData(sheetName, id, updateData, 'Jobs');
        return NextResponse.json({ status: 'success', data: result });
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    await ensureConfig();
    try {
        const { id, sheetName } = await req.json();
        const result = await GoogleService.deleteRow(sheetName, id, 'Jobs');
        return NextResponse.json({ status: 'success', data: result });
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}
