import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { pool } from '@/lib/db';

interface LeaderboardUser {
  id: string;
  username: string;
  level: number;
  xp: number;
  rank: number;
}

interface LevelingStats {
  topLevel: number;
  totalXp: number;
  activeUsers: number;
  leaderboard: LeaderboardUser[];
}

async function fetchDiscordUser(userId: string): Promise<string> {
  try {
    if (!process.env.DISCORD_BOT_TOKEN) {
      return userId;
    }

    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return userId;
    }

    const data = await response.json();
    return data.username || userId;
  } catch (error) {
    console.error(`Error fetching Discord user ${userId}:`, error);
    return userId;
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get top level and total XP
    const statsResult = await pool.query(`
      SELECT 
        MAX(level) as top_level,
        SUM(xp) as total_xp
      FROM users
    `);

    // Get active users (users who gained XP today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeUsersResult = await pool.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM users WHERE last_message_timestamp >= $1',
      [today.toISOString()]
    );

    // Get leaderboard
    const leaderboardResult = await pool.query(`
      SELECT 
        user_id as id,
        level,
        xp,
        ROW_NUMBER() OVER (ORDER BY xp DESC) as rank
      FROM users
      ORDER BY xp DESC
      LIMIT 100
    `);

    // Fetch Discord usernames for leaderboard users
    const leaderboard = await Promise.all(
      leaderboardResult.rows.map(async (user) => ({
        ...user,
        username: await fetchDiscordUser(user.id)
      }))
    );

    const stats: LevelingStats = {
      topLevel: parseInt(statsResult.rows[0].top_level) || 0,
      totalXp: parseInt(statsResult.rows[0].total_xp) || 0,
      activeUsers: parseInt(activeUsersResult.rows[0].count) || 0,
      leaderboard
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in leveling stats API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}