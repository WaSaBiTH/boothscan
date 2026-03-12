import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { activeQrTokens, boothStatus } from '@/lib/storage';

export async function POST(request: Request) {
    try {
        const { token, userId } = await request.json();

        if (!token || !userId) {
            return NextResponse.json({ error: 'Token and userId are required' }, { status: 400 });
        }

        // Find token data
        const tokenData = activeQrTokens.get(token);
        if (!tokenData) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
        }

        if (Date.now() > tokenData.expires) {
            activeQrTokens.delete(token);
            return NextResponse.json({ error: 'Token has expired' }, { status: 410 });
        }

        // Extend token lifespan by 5 minutes once scanned, ensuring user has time to press action
        tokenData.expires = Date.now() + (5 * 60 * 1000);
        activeQrTokens.set(token, tokenData);

        // Fetch student info using raw query to bypass schema mismatch
        const students = await prisma.$queryRaw<any[]>`SELECT * FROM users WHERE "StudentId" = ${userId} LIMIT 1`;
        const student = students.length > 0 ? students[0] : null;
        
        // Detect current state using raw query
        const checkins = await prisma.$queryRaw<any[]>`
            SELECT * FROM checkin 
            WHERE "student_id" = ${userId} AND "check_out" IS NULL 
            ORDER BY "check_in" DESC LIMIT 1
        `;
        let activeCheckin = checkins.length > 0 ? checkins[0] : null;

        // Enforce Guest rules: 24h auto-checkout
        if (activeCheckin && userId === 'Guest' && activeCheckin.checkIn) {
            const checkInTime = new Date(activeCheckin.checkIn).getTime();
            const hoursDiff = (Date.now() - checkInTime) / (1000 * 60 * 60);

            if (hoursDiff >= 24) {
                // Auto checkout using raw query
                await prisma.$executeRaw`
                    UPDATE checkin 
                    SET "check_out" = ${new Date(checkInTime + 24 * 60 * 60 * 1000)}
                    WHERE id = ${activeCheckin.id}
                `;
                activeCheckin = null;
            }
        }

        let recommendedAction = 'CHECK_IN';
        let currentSession: any = null;

        if (activeCheckin) {
            // Map raw SQL snake_case to camelCase
            const mappedCheckin = {
                id: activeCheckin.id,
                studentId: activeCheckin.student_id,
                roomCode: activeCheckin.room_code,
                checkIn: activeCheckin.check_in,
                checkOut: activeCheckin.check_out,
                guestMode: activeCheckin.guest_mode
            };
            
            if (userId === 'Guest' && mappedCheckin.roomCode !== tokenData.roomCode) {
                recommendedAction = 'GUEST_FORCED_CHECKOUT';
            } else if (mappedCheckin.roomCode === tokenData.roomCode) {
                recommendedAction = 'CHECK_OUT';
            } else {
                recommendedAction = 'SWAP';
            }
            currentSession = mappedCheckin;
        }

        // Mark booth as used to trigger refresh
        const status = boothStatus.get(tokenData.activityId);
        if (status && status.latestToken === token) {
            status.used = true;
        }

        return NextResponse.json({
            success: true,
            action: recommendedAction,
            currentSession,
            metadata: {
                activityId: tokenData.activityId,
                activityTitle: tokenData.activityTitle,
                startTime: tokenData.startTime,
                endTime: tokenData.endTime,
                roomCode: tokenData.roomCode,
                roomDesc: tokenData.roomDesc,
                studentName: student ? `${student.fname || ''} ${student.lname || ''}`.trim() : 'Guest User'
            }
        });

    } catch (error) {
        console.error('Scan discovery error:', error);
        return NextResponse.json({ error: 'Failed to verify check-in state' }, { status: 500 });
    }
}
