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
        const { buildingName, userId, username } = await request.json();
        const building = await prisma.building.update({
            where: { buildingCode: code },
            data: { buildingName }
        });
        if (userId && username) {
            await createAuditLog(userId, username, 'BUILDING_UPDATED', code, building);
        }
        return NextResponse.json(building);
    } catch (error) {
        console.error("PUT /api/admin/building error:", error);
        return NextResponse.json({ error: 'Failed to update building' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const { userId, username } = await request.json();
        const building = await prisma.building.findUnique({ where: { buildingCode: code } });
        if (!building) return NextResponse.json({ error: 'Building not found' }, { status: 404 });

        await prisma.building.delete({ where: { buildingCode: code } });

        if (userId && username) {
            await createAuditLog(userId, username, 'BUILDING_DELETED', code, building);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/admin/building error:", error);
        return NextResponse.json({ error: 'Failed to delete building' }, { status: 500 });
    }
}
