import { NextResponse } from 'next/server';
import { boothStatus } from '@/lib/storage';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ qr_session_id: string }> }
) {
    try {
        const { qr_session_id } = await params;
        const status = boothStatus.get(qr_session_id);

        const response = NextResponse.json({ used: status ? status.used : true });

        // Prevent caching
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return response;
    } catch (error) {
        return NextResponse.json({ used: true, reason: 'error' });
    }
}
