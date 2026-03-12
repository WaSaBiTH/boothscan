import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { activeQrTokens } from '@/lib/storage';

export async function POST(request: Request) {
    try {
        const { action, userId, token, isGuest } = await request.json();

        if (!action || !userId || !token) {
            return NextResponse.json({ error: 'Action, userId, and token are required' }, { status: 400 });
        }

        // Validate token again
        const tokenData = activeQrTokens.get(token);
        if (!tokenData || Date.now() > tokenData.expires) {
            if (tokenData) activeQrTokens.delete(token);
            return NextResponse.json({ error: 'Token expired or invalid. Please scan again.' }, { status: 404 });
        }

        const roomCode = tokenData.roomCode;

        // 1. Ensure student exists in users table using raw query
        await prisma.$executeRaw`
            INSERT INTO users ("StudentId", fname, lname, password, "roleId")
            VALUES (${userId}, ${isGuest ? 'Guest' : 'Student'}, ${isGuest ? 'User' : 'Member'}, '1234', 'guest')
            ON CONFLICT ("StudentId") DO NOTHING
        `;
 
        if (action === 'CHECK_IN' || action === 'SWAP') {
            if (action === 'SWAP') {
                await prisma.$executeRaw`
                    UPDATE checkin 
                    SET "check_out" = NOW() 
                    WHERE "student_id" = ${userId} AND "check_out" IS NULL
                `;
            }
 
            await prisma.$executeRaw`
                INSERT INTO checkin ("student_id", "room_code", "check_in")
                VALUES (${userId}, ${roomCode}, NOW())
            `;
        } else if (action === 'CHECK_OUT' || action === 'GUEST_FORCED_CHECKOUT') {
            if (action === 'GUEST_FORCED_CHECKOUT') {
                await prisma.$executeRaw`
                    UPDATE checkin 
                    SET "check_out" = NOW() 
                    WHERE "student_id" = ${userId} AND "check_out" IS NULL
                `;
            } else {
                await prisma.$executeRaw`
                    UPDATE checkin 
                    SET "check_out" = NOW() 
                    WHERE "student_id" = ${userId} AND "room_code" = ${roomCode} AND "check_out" IS NULL
                `;
            }
        }

        // Mark as completed
        activeQrTokens.delete(token);

        return NextResponse.json({
            success: true,
            message: `${action} completed successfully`,
            action
        });

    } catch (error) {
        console.error('Final action error:', error);
        return NextResponse.json({ error: 'Failed to complete transaction' }, { status: 500 });
    }
}
