import { NextResponse } from 'next/server';
import { activeQrTokens, boothStatus } from '@/lib/storage';

export async function POST(request: Request) {
    try {
        const { token } = await request.json();
        if (!token) return NextResponse.json({ success: false });

        const tokenData = activeQrTokens.get(token);
        if (tokenData) {
            // Extend token lifespan by 5 minutes from page load/ping
            tokenData.expires = Date.now() + (5 * 60 * 1000);
            activeQrTokens.set(token, tokenData);

            const status = boothStatus.get(tokenData.activityId);
            if (status && status.latestToken === token) {
                status.used = true;
            }
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false });
    }
}
