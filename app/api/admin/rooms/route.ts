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
        const rooms = await prisma.room.findMany({
            orderBy: { roomCode: 'asc' }
        });
        return NextResponse.json(rooms);
    } catch (error) {
        console.error("GET /api/admin/rooms error:", error);
        return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { roomCode, buildingCode, roomFloor, roomCapacity, roomDesc, userId, username } = await request.json();
        const room = await prisma.room.create({
            data: { 
                roomCode, 
                buildingCode, 
                roomFloor, 
                roomCapacity: String(roomCapacity), 
                roomDesc 
            }
        });
        if (userId && username) {
            await createAuditLog(userId, username, 'ROOM_CREATED', roomCode, room);
        }
        return NextResponse.json(room);
    } catch (error) {
        console.error("POST /api/admin/rooms error:", error);
        return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }
}
