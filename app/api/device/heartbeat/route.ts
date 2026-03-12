import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export async function POST(request: Request) {
    try {
        const { macAddress, ipAddress } = await request.json();

        // Check if we should update IP (don't overwrite real IP with localhost)
        let ipToUpdate = ipAddress;
        if (ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress === 'localhost') {
            const existing = await prisma.device.findUnique({ 
                where: { macAddress }, 
                select: { ipAddress: true } 
            });
            if (existing && existing.ipAddress && existing.ipAddress !== 'unknown' && existing.ipAddress !== '::1') {
                ipToUpdate = undefined; // Keep existing
            }
        }

        const device = await prisma.device.upsert({
            where: { macAddress },
            update: {
                lastSeen: new Date(),
                ...(ipToUpdate ? { ipAddress: ipToUpdate } : {})
            },
            create: {
                macAddress,
                ipAddress: ipToUpdate || 'unknown',
                deviceName: 'New Device',
                status: 'PENDING',
                roomCode: null,
                lastSeen: new Date()
            }
        });

        // Check for pending commands (and clear if found)
        if (device.lastCommand) {
            await prisma.device.update({
                where: { macAddress },
                data: { lastCommand: null }
            });
        }

        // Find current activity
        const currentActivity = await prisma.activity.findFirst({
            where: {
                devices: { some: { id: device.id } },
                startTime: { lte: new Date() },
                endTime: { gte: new Date() }
            },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                startTime: true,
                endTime: true,
                ad: true,
                qrCode: true
            }
        });

        // Fetch full device with Ad
        const fullDevice = await prisma.device.findUnique({
            where: { macAddress },
            include: { ad: true }
        });

        // Determine effective Ad (Activity Ad overrides Device Ad)
        const effectiveAd = currentActivity?.ad || fullDevice?.ad;

        return NextResponse.json({
            ...fullDevice,
            ad: effectiveAd,
            activity: currentActivity,
            deviceStatus: fullDevice?.status,
            command: device.lastCommand
        });

    } catch (error) {
        console.error('Heartbeat error:', error);
        return NextResponse.json({ 
            error: 'Heartbeat failed', 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
    }
}
