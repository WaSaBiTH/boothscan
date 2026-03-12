import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

function isDeviceOnline(lastSeen: Date): boolean {
    return (Date.now() - new Date(lastSeen).getTime()) < ONLINE_THRESHOLD_MS;
}

export async function GET() {
    try {
        const devices = await prisma.device.findMany();
        
        let online = 0, offline = 0, pending = 0, active = 0;

        devices.forEach(device => {
            if (device.status === 'PENDING') {
                pending++;
            } else if (device.status === 'ACTIVE') {
                active++;
                if (isDeviceOnline(device.lastSeen)) {
                    online++;
                } else {
                    offline++;
                }
            }
        });

        return NextResponse.json({
            total: devices.length,
            online,
            offline,
            pending,
            active
        });
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
