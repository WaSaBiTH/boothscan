import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { StudentId } = await request.json();
        if (!StudentId) {
            return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
        }

        // Use raw query to bypass schema mismatch in the generated client
        const students = await prisma.$queryRaw<any[]>`SELECT * FROM users WHERE "StudentId" = ${StudentId} LIMIT 1`;
        const student = students.length > 0 ? students[0] : null;

        if (!student) {
            return NextResponse.json({ 
                exists: false, 
                message: 'Student not found. You can proceed as Guest.' 
            }, { status: 404 });
        }

        return NextResponse.json({ exists: true, student });
    } catch (error) {
        console.error('Student Check Error:', error);
        return NextResponse.json({ error: 'Failed to verify identity' }, { status: 500 });
    }
}
