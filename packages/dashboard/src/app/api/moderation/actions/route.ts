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
        ma.*,
        u.username as user_username,
        m.username as moderator_username
      FROM mod_actions ma
      LEFT JOIN users u ON ma.user_id = u.user_id
      LEFT JOIN users m ON ma.moderator_id = m.user_id
      ORDER BY ma.created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ actions: rows });
  } catch (error) {
    console.error('Error fetching moderation actions:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { user_id, type, reason, duration } = body;

    if (!user_id || !type || !reason) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const { rows } = await sql`
      INSERT INTO mod_actions (
        type,
        user_id,
        moderator_id,
        reason,
        duration,
        is_active
      ) VALUES (
        ${type},
        ${user_id},
        ${session.user.id},
        ${reason},
        ${duration || null},
        true
      ) RETURNING *
    `;

    // If this is a warning, check if we need to apply automated actions
    if (type === 'warn') {
      const { rows: warnings } = await sql`
        SELECT COUNT(*) as count
        FROM mod_actions
        WHERE user_id = ${user_id}
        AND type = 'warn'
        AND is_active = true
      `;

      const warningCount = parseInt(warnings[0].count);

      // Get warning settings
      const { rows: settings } = await sql`
        SELECT * FROM warning_settings
        WHERE guild_id = ${process.env.DISCORD_GUILD_ID}
      `;

      if (settings.length > 0) {
        const { max_warnings, auto_timeout, timeout_duration, auto_kick, auto_ban } = settings[0];

        // Apply automated actions based on warning count
        if (warningCount >= max_warnings) {
          if (auto_ban) {
            await sql`
              INSERT INTO mod_actions (
                type,
                user_id,
                moderator_id,
                reason,
                is_active
              ) VALUES (
                'ban',
                ${user_id},
                ${session.user.id},
                'Automated ban due to reaching maximum warnings',
                true
              )
            `;
          } else if (auto_kick) {
            await sql`
              INSERT INTO mod_actions (
                type,
                user_id,
                moderator_id,
                reason,
                is_active
              ) VALUES (
                'kick',
                ${user_id},
                ${session.user.id},
                'Automated kick due to reaching maximum warnings',
                true
              )
            `;
          }
        } else if (auto_timeout && timeout_duration) {
          await sql`
            INSERT INTO mod_actions (
              type,
              user_id,
              moderator_id,
              reason,
              duration,
              is_active
            ) VALUES (
              'timeout',
              ${user_id},
              ${session.user.id},
              'Automated timeout due to warning',
              ${timeout_duration},
              true
            )
          `;
        }
      }
    }

    return NextResponse.json({ action: rows[0] });
  } catch (error) {
    console.error('Error creating moderation action:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 