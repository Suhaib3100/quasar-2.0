import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from 'shared/config/db-client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { rows } = await sql`
      UPDATE mod_actions
      SET is_active = false
      WHERE id = ${params.id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return new NextResponse('Moderation action not found', { status: 404 });
    }

    return NextResponse.json({ action: rows[0] });
  } catch (error) {
    console.error('Error revoking moderation action:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 