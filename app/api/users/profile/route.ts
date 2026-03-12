import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'StudentId required' }, { status: 400 });
        }

        // Use raw query to bypass schema mismatch and include role/major
        const users = await prisma.$queryRaw<any[]>`
            SELECT u.*, r.name as "roleName", m.name as "majorName" 
            FROM users u 
            LEFT JOIN "Role" r ON u."roleId" = r."roleId" 
            LEFT JOIN "major" m ON u."majorId" = m."majorId" 
            WHERE u."StudentId" = ${studentId}
            LIMIT 1
        `;
        const user = users.length > 0 ? users[0] : null;

        // Manually structure the object to match what the frontend expects
        if (user) {
            user.role = { name: user.roleName };
            user.major = { name: user.majorName };
        }
    

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
