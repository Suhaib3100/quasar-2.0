import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from 'shared/config/db-client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { rows } = await sql`
      SELECT 
        u.user_id,
        u.username,
        u.discriminator,
        u.avatar,
        u.joined_at,
        u.status,
        ARRAY_AGG(DISTINCT r.role_name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE u.guild_id = ${process.env.DISCORD_GUILD_ID}
      GROUP BY u.user_id, u.username, u.discriminator, u.avatar, u.joined_at, u.status
      ORDER BY u.username ASC
    `;

    return NextResponse.json({ members: rows });
  } catch (error) {
    console.error('Error fetching server members:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 