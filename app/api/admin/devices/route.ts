import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

function isDeviceOnline(lastSeen: Date): boolean {
    return (Date.now() - new Date(lastSeen).getTime()) < ONLINE_THRESHOLD_MS;
}

export async function GET() {
    try {
        // Use raw query for devices to ensure we get all fields correctly if there's a schema mismatch
        // Join with Zone name if available
        const devices: any[] = await prisma.$queryRaw`
            SELECT d.*, z.name as "zoneName"
            FROM "Device" d
            LEFT JOIN "Zone" z ON d."zoneId" = z.id
            ORDER BY d."lastSeen" DESC
        `;

        const devicesWithStatus = devices.map(device => ({
            ...device,
            zone: device.zoneId ? { id: device.zoneId, name: device.zoneName } : null,
            isOnline: isDeviceOnline(device.lastSeen)
        }));

        return NextResponse.json(devicesWithStatus);
    } catch (error) {
        console.error("❌ Database Error (Admin Devices):", error);
        return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }
}
