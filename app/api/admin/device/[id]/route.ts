import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Create audit log entry (helper)
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
        const body = await request.json();
        const { deviceName, roomCode, status, zoneId, lastCommand, userId, username } = body;

        // Perform update
        const device = await prisma.device.update({
            where: { id },
            data: { 
                ...(deviceName && { deviceName }),
                ...(roomCode && { roomCode }),
                ...(status && { status }),
                ...(zoneId && { zoneId }),
                ...(lastCommand && { lastCommand })
            }
        });

        if (userId && username) {
            const auditTarget = roomCode || device.roomCode || id;
            const auditAction = lastCommand === 'SHUTDOWN' ? 'DEVICE_SHUTDOWN' : 'DEVICE_UPDATED';
            await createAuditLog(userId, username, auditAction, auditTarget, device);
        }

        return NextResponse.json(device);
    } catch (error) {
        console.error("PUT /api/admin/device error:", error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { userId, username } = body;

        const device = await prisma.device.findUnique({ where: { id } });
        if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 });

        await prisma.device.delete({ where: { id } });

        if (userId && username) {
            const auditTarget = device.roomCode || id;
            await createAuditLog(userId, username, 'DEVICE_DELETED', auditTarget, device);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/admin/device error:", error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
