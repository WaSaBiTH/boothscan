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
        const buildings = await prisma.building.findMany({
            orderBy: { buildingCode: 'asc' }
        });
        return NextResponse.json(buildings);
    } catch (error) {
        console.error("GET /api/admin/buildings error:", error);
        return NextResponse.json({ error: 'Failed to fetch buildings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { buildingCode, buildingName, userId, username } = await request.json();
        const building = await prisma.building.create({
            data: { buildingCode, buildingName }
        });
        if (userId && username) {
            await createAuditLog(userId, username, 'BUILDING_CREATED', buildingCode, building);
        }
        return NextResponse.json(building);
    } catch (error) {
        console.error("POST /api/admin/buildings error:", error);
        return NextResponse.json({ error: 'Failed to create building' }, { status: 500 });
    }
}
