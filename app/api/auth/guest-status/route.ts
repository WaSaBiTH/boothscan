import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const checkins = await prisma.$queryRaw<any[]>`
            SELECT * FROM checkin 
            WHERE "student_id" = 'Guest' AND "check_out" IS NULL 
            LIMIT 1
        `;
        let activeCheckin = checkins.length > 0 ? checkins[0] : null;

        if (activeCheckin && activeCheckin.check_in) {
            const checkInTime = new Date(activeCheckin.check_in).getTime();
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

        return NextResponse.json({ isActive: !!activeCheckin });
    } catch (error) {
        console.error('Guest Status Error:', error);
        return NextResponse.json({ error: 'Failed to check guest status' }, { status: 500 });
    }
}
