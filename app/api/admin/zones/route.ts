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
        const zones = await prisma.zone.findMany({
            include: { devices: { select: { id: true } } }
        });
        return NextResponse.json(zones.map(z => ({ ...z, deviceCount: z.devices.length })));
    } catch (error) {
        console.error("GET /api/admin/zones error:", error);
        return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, deviceIds, userId, username } = await request.json();
        const zone = await prisma.zone.create({
            data: {
                name,
                devices: deviceIds ? { connect: deviceIds.map((id: string) => ({ id })) } : undefined
            }
        });
        if (userId && username) {
            await createAuditLog(userId, username, 'ZONE_CREATED', zone.id, zone);
        }
        return NextResponse.json(zone);
    } catch (error) {
        console.error("POST /api/admin/zones error:", error);
        return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 });
    }
}
