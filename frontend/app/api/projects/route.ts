import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/projectService';
import { GoogleService } from '@/lib/services/googleService';
import { ensureConfig, errMsg } from '@/lib/api-utils';

interface JobEntry { status?: string; cost?: number }

export async function GET() {
    await ensureConfig();
    try {
        const projects = await ProjectService.getAll();
        const enriched = await Promise.all(
            projects.map(async (p) => {
                try {
                    const jobs = await GoogleService.getReimbursements(undefined, undefined, 'Jobs', p.slug) as JobEntry[];
                    return {
                        ...p,
                        stats: {
                            total: jobs.length,
                            completed: jobs.filter((j) => j.status === 'Completed').length,
                            totalCost: jobs.reduce((sum, j) => sum + (j.cost ?? 0), 0),
                        },
                    };
                } catch {
                    return { ...p, stats: { total: 0, completed: 0, totalCost: 0 } };
                }
            }),
        );
        return NextResponse.json(enriched);
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await ensureConfig();
    try {
        const { name, color } = await req.json();
        if (!name?.trim()) {
            return NextResponse.json({ status: 'error', message: 'Project name is required' }, { status: 400 });
        }
        const project = await ProjectService.create(name.trim(), color);
        return NextResponse.json({ status: 'success', data: project });
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}
