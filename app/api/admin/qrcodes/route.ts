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
        const qrcodes = await prisma.qrCode.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(qrcodes);
    } catch (error) {
        console.error("GET /api/admin/qrcodes error:", error);
        return NextResponse.json({ error: 'Failed to fetch QR codes' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, description, type, data, userId, username } = await request.json();
        const qrCode = await prisma.qrCode.create({
            data: { name, description, type, data }
        });
        if (userId && username) {
            await createAuditLog(userId, username, 'QRCODE_CREATED', name, qrCode);
        }
        return NextResponse.json(qrCode);
    } catch (error) {
        console.error("POST /api/admin/qrcodes error:", error);
        return NextResponse.json({ error: 'Failed to create QR code' }, { status: 500 });
    }
}
