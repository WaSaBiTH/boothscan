import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { gatekeeperTickets, TICKET_EXPIRY_MS } from '@/lib/storage';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { username } = await request.json();
        if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

        // Use raw query to bypass schema mismatch and include role
        const users = await prisma.$queryRaw<any[]>`
            SELECT u.*, r.name as "roleName" 
            FROM users u 
            LEFT JOIN "Role" r ON u."roleId" = r."roleId" 
            WHERE u."StudentId" = ${username}
            LIMIT 1
        `;
        const user = users.length > 0 ? users[0] : null;

        if (!user) {
            return NextResponse.json({ error: 'User not found in the system' }, { status: 403 });
        }

        // Generate a secure random slug
        const slug = crypto.randomBytes(16).toString('hex');

        // Store ticket
        gatekeeperTickets.set(slug, {
            userId: user.id,
            username: user.fname || 'Admin',
            expires: Date.now() + TICKET_EXPIRY_MS
        });

        // Cleanup expired tickets
        const now = Date.now();
        for (const [key, ticket] of gatekeeperTickets.entries()) {
            if (ticket.expires < now) gatekeeperTickets.delete(key);
        }

        return NextResponse.json({ success: true, path: slug });
    } catch (error) {
        console.error('Gatekeeper error:', error);
        return NextResponse.json({ error: 'Failed to generate path' }, { status: 500 });
    }
}
