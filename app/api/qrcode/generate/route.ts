import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { activeQrTokens, boothStatus, QR_VALIDITY_MS } from '@/lib/storage';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { qr_session_id, macAddress } = await request.json();

        if (!qr_session_id) {
            return NextResponse.json({ error: 'qr_session_id is required' }, { status: 400 });
        }

        // Fetch Activity and Device/Room info
        const [activity, device] = await Promise.all([
            prisma.activity.findUnique({ where: { id: qr_session_id } }),
            macAddress ? prisma.device.findUnique({
                where: { macAddress },
                include: { room: true }
            }) : null
        ]);

        if (!activity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // Generate a simple unique token
        const token = crypto.randomBytes(8).toString('hex');
        const now = Date.now();

        // 1. Register token in global registry (active for 5 mins)
        activeQrTokens.set(token, {
            expires: now + QR_VALIDITY_MS,
            activityId: activity.id,
            activityTitle: activity.title,
            startTime: activity.startTime,
            endTime: activity.endTime,
            roomCode: (device && device.roomCode) ? device.roomCode : 'Unknown',
            roomDesc: (device && device.room && device.room.roomDesc) ? device.room.roomDesc : 'Unknown Location'
        });

        // 2. Update booth status (tracking if the current token on screen has been scanned)
        boothStatus.set(qr_session_id, {
            latestToken: token,
            used: false
        });

        // Cleanup expired tokens
        for (const [t, data] of activeQrTokens.entries()) {
            if (data.expires < now) activeQrTokens.delete(t);
        }

        const host = request.headers.get('host') || 'localhost:6060';
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        
        let frontendUrl = process.env.NEXT_PUBLIC_SCAN_WEB || process.env.FRONTEND_URL || `${protocol}://${host}`;
        
        // Remove trailing slash if present to avoid double slashes in the scan_url
        if (frontendUrl.endsWith('/')) {
            frontendUrl = frontendUrl.slice(0, -1);
        }

        return NextResponse.json({
            message: "QR Token generated successfully",
            qr_token: token,
            scan_url: `${frontendUrl}/scan?token=${token}`,
            expires_in: QR_VALIDITY_MS / 1000,
            metadata: {
                activityTitle: activity.title,
                roomCode: device?.roomCode,
                roomDesc: device?.room?.roomDesc
            }
        });

    } catch (error) {
        console.error('QR Generate error:', error);
        return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
    }
}
