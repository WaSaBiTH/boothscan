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
        const { name, description, type, data, userId, username } = await request.json();
        const qrCode = await prisma.qrCode.update({
            where: { id },
            data: { name, description, type, data }
        });
        if (userId && username) {
            await createAuditLog(userId, username, 'QRCODE_UPDATED', name, qrCode);
        }
        return NextResponse.json(qrCode);
    } catch (error) {
        console.error("PUT /api/admin/qrcode error:", error);
        return NextResponse.json({ error: 'Failed to update QR code' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId, username } = await request.json();
        const qrCode = await prisma.qrCode.findUnique({ where: { id } });
        if (!qrCode) return NextResponse.json({ error: 'QR Code not found' }, { status: 404 });

        await prisma.qrCode.delete({ where: { id } });

        if (userId && username && qrCode) {
            await createAuditLog(userId, username, 'QRCODE_DELETED', qrCode.name, qrCode);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/admin/qrcode error:", error);
        return NextResponse.json({ error: 'Failed to delete QR code' }, { status: 500 });
    }
}
