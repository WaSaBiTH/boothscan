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
        const { name, url, type, userId, username } = await request.json();
        const ad = await prisma.ad.update({
            where: { id },
            data: { name, url, type }
        });
        if (userId && username) {
            await createAuditLog(userId, username, 'AD_UPDATED', name, ad);
        }
        return NextResponse.json(ad);
    } catch (error) {
        console.error("PUT /api/admin/ad error:", error);
        return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId, username } = await request.json();
        const ad = await prisma.ad.findUnique({ where: { id } });
        if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });

        await prisma.ad.delete({ where: { id } });

        if (userId && username && ad) {
            await createAuditLog(userId, username, 'AD_DELETED', ad.name, ad);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/admin/ad error:", error);
        return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 });
    }
}
