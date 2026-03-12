import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { macAddress, ipAddress } = await request.json();

        let device = await prisma.device.findUnique({
            where: { macAddress }
        });

        if (!device) {
            device = await prisma.device.create({
                data: {
                    macAddress,
                    ipAddress,
                    status: 'PENDING',
                    roomCode: null
                }
            });
            console.log(`New Device Registered: ${macAddress}`);
        } else {
            device = await prisma.device.update({
                where: { macAddress },
                data: { ipAddress, lastSeen: new Date() }
            });
        }

        return NextResponse.json(device);
    } catch (error) {
        console.error('Device Register Error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
