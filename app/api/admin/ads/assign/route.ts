import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

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

export async function POST(request: Request) {
    try {
        const { adId, deviceIds, assignToAll, userId, username } = await request.json();

        if (assignToAll) {
            // Cleanup: Delete devices that are PENDING and OFFLINE
            const offlineThreshold = new Date(Date.now() - ONLINE_THRESHOLD_MS);
            await prisma.device.deleteMany({
                where: {
                    status: 'PENDING',
                    lastSeen: { lt: offlineThreshold }
                }
            });

            // Set adId for ALL devices (excluding PENDING)
            await prisma.device.updateMany({
                where: { status: { in: ['ACTIVE', 'DISABLED'] } },
                data: { adId }
            });
        } else {
            if (adId) {
                // Sync adId to the requested deviceIds only
                await prisma.device.updateMany({
                    where: { adId: adId, id: { notIn: deviceIds || [] } },
                    data: { adId: null }
                });

                if (deviceIds && deviceIds.length > 0) {
                    await prisma.device.updateMany({
                        where: { id: { in: deviceIds } },
                        data: { adId }
                    });
                }
            } else {
                // clear flag
                if (deviceIds && deviceIds.length > 0) {
                    await prisma.device.updateMany({
                        where: { id: { in: deviceIds } },
                        data: { adId: null }
                    });
                }
            }
        }

        if (userId && username) {
            let adName = 'Clear Ad';
            if (adId) {
                const ad = await prisma.ad.findUnique({ where: { id: adId }, select: { name: true } });
                adName = ad?.name ? `Ad:${ad.name}` : `Ad:${adId}`;
            }

            let auditTarget = adName;
            if (assignToAll) {
                auditTarget = `All Rooms (${auditTarget})`;
            } else if (deviceIds && deviceIds.length > 0) {
                const devices = await prisma.device.findMany({
                    where: { id: { in: deviceIds } },
                    select: { roomCode: true }
                });
                const roomCodes = devices.map(d => d.roomCode).filter(Boolean).join(',');
                auditTarget = `${roomCodes || 'Selected Devices'} (${auditTarget})`;
            }
            await createAuditLog(userId, username, 'AD_ASSIGNED', auditTarget, { assignToAll, deviceIds, adId });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Assign Ad error:", error);
        return NextResponse.json({ error: 'Failed to assign ad' }, { status: 500 });
    }
}
