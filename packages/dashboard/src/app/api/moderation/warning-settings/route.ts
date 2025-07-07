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
      SELECT *
      FROM warning_settings
      WHERE guild_id = ${process.env.DISCORD_GUILD_ID}
    `;

    if (rows.length === 0) {
      // Create default settings if none exist
      const { rows: newSettings } = await sql`
        INSERT INTO warning_settings (
          guild_id,
          max_warnings,
          auto_timeout,
          timeout_duration,
          auto_kick,
          auto_ban
        ) VALUES (
          ${process.env.DISCORD_GUILD_ID},
          3,
          true,
          60,
          false,
          false
        ) RETURNING *
      `;
      return NextResponse.json({ settings: newSettings[0] });
    }

    return NextResponse.json({ settings: rows[0] });
  } catch (error) {
    console.error('Error fetching warning settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const {
      max_warnings,
      auto_timeout,
      timeout_duration,
      auto_kick,
      auto_ban
    } = body;

    const { rows } = await sql`
      UPDATE warning_settings
      SET
        max_warnings = ${max_warnings},
        auto_timeout = ${auto_timeout},
        timeout_duration = ${timeout_duration},
        auto_kick = ${auto_kick},
        auto_ban = ${auto_ban}
      WHERE guild_id = ${process.env.DISCORD_GUILD_ID}
      RETURNING *
    `;

    if (rows.length === 0) {
      // Create settings if they don't exist
      const { rows: newSettings } = await sql`
        INSERT INTO warning_settings (
          guild_id,
          max_warnings,
          auto_timeout,
          timeout_duration,
          auto_kick,
          auto_ban
        ) VALUES (
          ${process.env.DISCORD_GUILD_ID},
          ${max_warnings},
          ${auto_timeout},
          ${timeout_duration},
          ${auto_kick},
          ${auto_ban}
        ) RETURNING *
      `;
      return NextResponse.json({ settings: newSettings[0] });
    }

    return NextResponse.json({ settings: rows[0] });
  } catch (error) {
    console.error('Error updating warning settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 