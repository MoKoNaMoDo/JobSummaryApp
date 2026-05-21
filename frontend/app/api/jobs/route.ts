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
        const includeOngoing = searchParams.get('includeOngoing') === 'true';

        const jobs = await GoogleService.getReimbursements(month, year, 'Jobs', projectSlug);

        if (includeOngoing && projectSlug && month && year) {
            const ongoing = await GoogleService.getOngoingJobsFromPreviousMonths(projectSlug, month, year, 3);
            const seen = new Set(jobs.map((j: { id: number; sheetName: string }) => `${j.id}-${j.sheetName}`));
            const unique = ongoing.filter(j => !seen.has(`${j.id}-${j.sheetName}`));
            return NextResponse.json([...jobs, ...unique]);
        }

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
        const file = (formData.get('image') ?? formData.get('file')) as File | null;
        const assignee = (formData.get('assignee') as string) || 'Unassigned';
        const taskName = formData.get('taskName') as string | null;
        const workDate = formData.get('workDate') as string | null;
        const status = formData.get('status') as string | null;

        let extractedData: ExtractedJobData = {};
        let imageUrl = '';

        let imageUploaded = false;
        if (file) {
            console.log(`[/api/jobs] Uploading image: ${file.name} (${file.type}, ${file.size} bytes)`);
            const buffer = Buffer.from(await file.arrayBuffer());
            imageUrl = await GoogleService.uploadSlip(
                { buffer, mimetype: file.type, originalname: file.name },
                projectSlug || 'Job',
                '',
                'Jobs',
            );
            imageUploaded = !!imageUrl && imageUrl !== 'UPLOAD_FAILED';
            console.log(`[/api/jobs] Image upload result: ${imageUploaded ? 'SUCCESS' : 'FAILED'} → ${imageUrl}`);
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
        return NextResponse.json({ status: 'success', data: result, imageUploaded });
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    await ensureConfig();
    try {
        const data = await req.json();
        const { sheetName, id, ...updateData } = data;

        // Detect cross-month drag: if the new date falls in a different month than the tab
        if (updateData.date && sheetName) {
            const dateObj = new Date(updateData.date);
            const newMonthYear = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
            const oldMonthYear = (sheetName as string).match(/(\d{2}-\d{4})$/)?.[1];
            if (oldMonthYear && oldMonthYear !== newMonthYear) {
                await GoogleService.moveJobToNewMonth(sheetName, id, updateData.date);
                return NextResponse.json({ status: 'success', moved: true });
            }
        }

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
