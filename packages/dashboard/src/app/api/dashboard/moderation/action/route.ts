import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { pool } from '@/lib/db';

type ModActionType = 'warn' | 'timeout' | 'kick' | 'ban';

interface ModActionRequest {
  userId: string;
  type: ModActionType;
  reason: string;
  duration?: number;
}

async function checkModeratorPermissions(userId: string): Promise<boolean> {
  try {
    if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD_ID) {
      console.error('Missing required Discord configuration');
      return false;
    }

    if (!process.env.DISCORD_ADMIN_ROLE_ID && !process.env.DISCORD_MOD_ROLE_ID) {
      console.error('No moderator roles configured');
      return false;
    }

    const response = await fetch(`https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${userId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`Failed to fetch member roles: ${response.status}`);
      return false;
    }

    const member = await response.json();
    const modRoles = [
      process.env.DISCORD_ADMIN_ROLE_ID,
      process.env.DISCORD_MOD_ROLE_ID
    ].filter(Boolean);

    return member.roles.some((role: string) => modRoles.includes(role));
  } catch (error) {
    console.error('Error checking moderator permissions:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const isModerator = await checkModeratorPermissions(session.user.id);
    if (!isModerator) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body: ModActionRequest = await req.json();
    const { userId, type, reason, duration } = body;

    // Insert the moderation action into the database
    await pool.query(
      'INSERT INTO mod_actions (type, user_id, moderator_id, reason, duration) VALUES ($1, $2, $3, $4, $5)',
      [type, userId, session.user.id, reason, duration]
    );

    // Notify Discord bot about the moderation action (you'll need to implement this)
    const botResponse = await fetch(`${process.env.BOT_API_URL}/moderation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BOT_API_TOKEN}`
      },
      body: JSON.stringify({
        type,
        userId,
        moderatorId: session.user.id,
        reason,
        duration
      })
    });

    if (!botResponse.ok) {
      throw new Error('Failed to notify bot about moderation action');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in moderation action API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}