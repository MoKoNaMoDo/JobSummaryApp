import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/projectService';
import { GoogleService } from '@/lib/services/googleService';
import { ConfigService } from '@/lib/services/configService';

let configLoaded = false;
async function ensureConfig() {
    if (!configLoaded) { await ConfigService.load(); configLoaded = true; }
}

export async function GET() {
    await ensureConfig();
    try {
        const projects = await ProjectService.getAll();
        const enriched = await Promise.all(projects.map(async (p) => {
            try {
                // Default to 'Jobs' prefix and the project slug
                const jobs = await GoogleService.getReimbursements(undefined, undefined, 'Jobs', p.slug);
                const total = jobs.length;
                const completed = jobs.filter((j: any) => j.status === 'Completed').length;
                const totalCost = jobs.reduce((sum: number, j: any) => sum + (j.cost || 0), 0);
                return { ...p, stats: { total, completed, totalCost } };
            } catch (err) {
                console.error(`Error enriching project ${p.slug}:`, err);
                return { ...p, stats: { total: 0, completed: 0, totalCost: 0 } };
            }
        }));
        return NextResponse.json(enriched);
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
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
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
