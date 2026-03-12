import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { macAddress: string } }
) {
    try {
        const { macAddress } = params;
        const device = await prisma.device.findUnique({
            where: { macAddress },
            include: {
                ad: true,
                activities: {
                    where: { endTime: { gte: new Date() } },
                    orderBy: { startTime: 'asc' },
                    take: 1
                }
            }
        });

        if (!device) {
            return NextResponse.json({ error: 'Device not found' }, { status: 404 });
        }

        return NextResponse.json(device);
    } catch (error) {
        console.error('Get config error:', error);
        return NextResponse.json({ error: 'Get config failed' }, { status: 500 });
    }
}
