import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { gatekeeperTickets } from '@/lib/storage';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const ticket = gatekeeperTickets.get(slug);

        if (!ticket) {
            return NextResponse.json({ valid: false, error: 'Invalid or expired ticket' }, { status: 404 });
        }

        if (Date.now() > ticket.expires) {
            gatekeeperTickets.delete(slug);
            return NextResponse.json({ valid: false, error: 'Ticket expired' }, { status: 410 });
        }

        // Verify the user is an admin using raw query to bypass schema mismatch
        const users = await prisma.$queryRaw<any[]>`
            SELECT u.*, r.name as "roleName" 
            FROM users u 
            LEFT JOIN "Role" r ON u."roleId" = r."roleId" 
            WHERE u.id = ${ticket.userId}
            LIMIT 1
        `;

        const user = users.length > 0 ? users[0] : null;

        if (!user) {
            return NextResponse.json({ valid: false, error: 'User not found' }, { status: 404 });
        }

        // Check if user is an admin based on roleName or roleId
        const isAdmin = user.roleName?.toLowerCase() === 'admin' || user.roleId === 'admin';

        if (!isAdmin) {
            return NextResponse.json({ valid: false, error: 'Access denied. Admin privileges required.' }, { status: 403 });
        }

        // Delete ticket after successful validation to prevent reuse
        gatekeeperTickets.delete(slug);

        return NextResponse.json({
            valid: true,
            userId: ticket.userId,
            username: ticket.username,
            role: user.roleName || user.roleId
        });
    } catch (error) {
        console.error('Validate ticket error:', error);
        return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 });
    }
}
