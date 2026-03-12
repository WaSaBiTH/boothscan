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

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { name, deviceIds, userId, username } = await request.json();
        const zone = await prisma.zone.update({
            where: { id },
            data: {
                name,
                devices: deviceIds ? { set: deviceIds.map((id: string) => ({ id })) } : undefined
            }
        });
        if (userId && username) {
            await createAuditLog(userId, username, 'ZONE_UPDATED', zone.id, zone);
        }
        return NextResponse.json(zone);
    } catch (error) {
        console.error("PUT /api/admin/zone error:", error);
        return NextResponse.json({ error: 'Failed to update zone' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId, username } = await request.json();
        const zone = await prisma.zone.findUnique({ where: { id } });
        if (!zone) return NextResponse.json({ error: 'Zone not found' }, { status: 404 });

        await prisma.zone.delete({ where: { id } });

        if (userId && username && zone) {
            await createAuditLog(userId, username, 'ZONE_DELETED', id, zone);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/admin/zone error:", error);
        return NextResponse.json({ error: 'Failed to delete zone' }, { status: 500 });
    }
}
