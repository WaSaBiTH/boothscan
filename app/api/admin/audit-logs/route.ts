import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || '50';
        const page = searchParams.get('page') || '1';
        
        const take = Math.min(Number(limit), 1000);
        const skip = (Number(page) - 1) * take;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take,
                skip
            }),
            prisma.auditLog.count()
        ]);

        return NextResponse.json({ 
            logs, 
            total, 
            page: Number(page), 
            pages: Math.ceil(total / take) 
        });
    } catch (error) {
        console.error("GET /api/admin/audit-logs error:", error);
        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}
