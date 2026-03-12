import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function createAuditLog(userId: string | number, username: string, action: string, targetId: string, details?: any) {
    await prisma.auditLog.create({
        data: {
            userId: String(userId),
            username,
            action,
            targetId,
            details
        }
    });
}

export async function GET() {
    try {
        const ads = await prisma.ad.findMany({
            include: { devices: { select: { id: true, deviceName: true, roomCode: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(ads.map(ad => ({ ...ad, deviceCount: ad.devices.length, devices: ad.devices })));
    } catch (error) {
        console.error("GET /api/admin/ads error:", error);
        return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, url, type, userId, username } = await request.json();
        const ad = await prisma.ad.create({
            data: { name, url, type }
        });
        if (userId && username) {
            await createAuditLog(userId, username, 'AD_CREATED', name, ad);
        }
        return NextResponse.json(ad);
    } catch (error) {
        console.error("POST /api/admin/ads error:", error);
        return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
    }
}
