import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { pool } from '@/lib/db';

interface DiscordMember {
  id: string;
  username: string;
  joinedAt: string;
  roles: string[];
}

async function fetchDiscordGuildMembers(guildId: string, botToken: string): Promise<DiscordMember[]> {
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Discord guild members');
    }

    const members = await response.json();
    return members.map((member: any) => ({
      id: member.user.id,
      username: member.user.username,
      joinedAt: member.joined_at,
      roles: member.roles
    }));
  } catch (error) {
    console.error('Error fetching Discord guild members:', error);
    throw error;
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD_ID) {
      throw new Error('Missing Discord configuration');
    }

    // Fetch members from Discord API
    const members = await fetchDiscordGuildMembers(
      process.env.DISCORD_GUILD_ID,
      process.env.DISCORD_BOT_TOKEN
    );

    // Get join/leave stats from database
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newJoinsResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= $1',
      [sevenDaysAgo.toISOString()]
    );

    const leavesResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_leaves WHERE left_at >= $1',
      [sevenDaysAgo.toISOString()]
    );

    return NextResponse.json({
      members,
      totalMembers: members.length,
      newJoins: parseInt(newJoinsResult.rows[0].count) || 0,
      leaves: parseInt(leavesResult.rows[0].count) || 0
    });
  } catch (error) {
    console.error('Error in members API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}