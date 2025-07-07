import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { rows } = await sql`
      SELECT 
        ma.*,
        u.username as username,
        m.username as moderator_name
      FROM mod_actions ma
      LEFT JOIN users u ON ma.user_id = u.user_id
      LEFT JOIN users m ON ma.moderator_id = m.user_id
      WHERE ma.type = 'warn'
      ORDER BY ma.created_at DESC
    `;

    return NextResponse.json({ warnings: rows });
  } catch (error) {
    console.error('Error fetching warnings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
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
      AND type = 'warn'
      RETURNING *
    `;

    if (rows.length === 0) {
      return new NextResponse('Warning not found', { status: 404 });
    }

    return NextResponse.json({ warning: rows[0] });
  } catch (error) {
    console.error('Error removing warning:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 