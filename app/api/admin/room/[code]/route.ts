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
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const { buildingCode, roomFloor, roomCapacity, roomDesc, userId, username } = await request.json();
        const room = await prisma.room.update({
            where: { roomCode: code },
            data: { 
                buildingCode, 
                roomFloor, 
                roomCapacity: String(roomCapacity), 
                roomDesc 
            }
        });
        if (userId && username) {
            await createAuditLog(userId, username, 'ROOM_UPDATED', code, room);
        }
        return NextResponse.json(room);
    } catch (error) {
        console.error("PUT /api/admin/room error:", error);
        return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const { userId, username } = await request.json();
        const room = await prisma.room.findUnique({ where: { roomCode: code } });
        if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

        await prisma.room.delete({ where: { roomCode: code } });

        if (userId && username) {
            await createAuditLog(userId, username, 'ROOM_DELETED', code, room);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/admin/room error:", error);
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
    }
}
