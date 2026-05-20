import { NextRequest, NextResponse } from 'next/server';
import { ConfigService } from '@/lib/services/configService';
import { ensureConfig, errMsg } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
    await ensureConfig();
    try {
        const { password } = await req.json();
        const systemPassword = ConfigService.get('systemPassword');

        if (password === systemPassword) {
            return NextResponse.json({ status: 'success' });
        }
        return NextResponse.json({ status: 'error', message: 'Invalid password' }, { status: 401 });
    } catch (error: unknown) {
        return NextResponse.json({ status: 'error', message: errMsg(error) }, { status: 500 });
    }
}
