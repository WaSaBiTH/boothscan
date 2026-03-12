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

export async function PUT(request: Request) {
    try {
        const { deviceIds, status, zoneId, lastCommand, userId, username } = await request.json();

        if (!deviceIds || !Array.isArray(deviceIds)) {
            return NextResponse.json({ error: 'deviceIds array required' }, { status: 400 });
        }

        await prisma.device.updateMany({
            where: { id: { in: deviceIds } },
            data: { 
                ...(status && { status }), 
                ...(zoneId && { zoneId }), 
                ...(lastCommand && { lastCommand }) 
            }
        });

        if (userId && username) {
            const devices = await prisma.device.findMany({
                where: { id: { in: deviceIds } },
                select: { roomCode: true }
            });
            const roomCodes = devices.map(d => d.roomCode).filter(Boolean).join(',');
            const auditAction = lastCommand === 'SHUTDOWN' ? 'DEVICES_BULK_SHUTDOWN' : 'DEVICES_BULK_UPDATE';
            await createAuditLog(userId, username, auditAction, roomCodes || 'Multiple Devices', { status, zoneId, count: deviceIds.length, lastCommand });
        }

        return NextResponse.json({ success: true, count: deviceIds.length });
    } catch (error) {
        console.error('Bulk update error:', error);
        return NextResponse.json({ error: 'Bulk update failed' }, { status: 500 });
    }
}
