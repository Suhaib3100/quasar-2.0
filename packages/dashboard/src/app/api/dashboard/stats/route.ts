import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { pool } from '@/lib/db';

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

async function fetchDiscordUser(userId: string): Promise<DiscordUser | null> {
  try {
    if (!process.env.DISCORD_BOT_TOKEN) {
      console.error('DISCORD_BOT_TOKEN is not configured');
      return null;
    }

    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch Discord user ${userId}:`, errorText);
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      username: data.username || 'Unknown User',
      avatar: data.avatar
    };
  } catch (error) {
    console.error(`Error fetching Discord user ${userId}:`, error);
    return null;
  }
}

async function fetchDiscordUsers(userIds: string[]): Promise<Map<string, DiscordUser>> {
  const userMap = new Map<string, DiscordUser>();
  const uniqueIds = Array.from(new Set(userIds));

  await Promise.all(
    uniqueIds.map(async (userId) => {
      const user = await fetchDiscordUser(userId);
      if (user) {
        userMap.set(userId, user);
      } else {
        userMap.set(userId, {
          id: userId,
          username: 'Unknown User',
          avatar: null
        });
      }
    })
  );

  return userMap;
}

// Helper function to retry database operations
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error('Max retries reached');
}

interface DashboardStats {
  totalMembers: number;
  activeUsers: number;
  messagesToday: number;
  modActions: number;
  recentActivity: Array<{
    id: string;
    type: string;
    user: string;
    action: string;
    timestamp: string;
  }>;
  topMembers: Array<{
    id: string;
    username: string;
    messages: number;
    level: number;
  }>;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get total members count with retry
    const totalMembers = await withRetry(async () => {
      const result = await pool.query(
        'SELECT COUNT(DISTINCT user_id) as count FROM users'
      );
      return parseInt(result.rows[0].count) || 0;
    });

    // Get active users count with retry
    const activeUsers = await withRetry(async () => {
      const result = await pool.query(
        'SELECT COUNT(DISTINCT user_id) as count FROM users WHERE last_message_timestamp > NOW() - INTERVAL \'24 hours\''
      );
      return parseInt(result.rows[0].count) || 0;
    });

    // Get messages sent today with retry
    const messagesToday = await withRetry(async () => {
      const result = await pool.query(
        'SELECT SUM(message_count) as count FROM users WHERE DATE(last_message_timestamp) = CURRENT_DATE'
      );
      return parseInt(result.rows[0].count) || 0;
    });

    // For now, mod actions will be 0 as we don't have a moderation table yet
    const modActions = 0;

    // Get recent activity with retry
    const recentActivity = await withRetry(async () => {
      const result = await pool.query(`
        SELECT DISTINCT ON (user_id)
          user_id as id,
          'level_up' as type,
          CONCAT('reached level ', level) as action,
          updated_at as timestamp
        FROM users
        WHERE level > 0
        ORDER BY user_id, updated_at DESC
        LIMIT 10
      `);
      return result.rows;
    });

    // Get top members with retry
    const topMembers = await withRetry(async () => {
      const result = await pool.query(`
        SELECT
          user_id as id,
          message_count as messages,
          level
        FROM users
        ORDER BY xp DESC
        LIMIT 10
      `);
      return result.rows;
    });

    // Fetch Discord usernames for all users
    const userIds = [
      ...recentActivity.map(activity => activity.id),
      ...topMembers.map(member => member.id)
    ];

    const userMap = await fetchDiscordUsers(userIds);

    // Add user information to the activity and member data
    const enrichedActivity = recentActivity.map(activity => {
      const user = userMap.get(activity.id);
      return {
        ...activity,
        user: user?.username || activity.id,
        avatar: user?.avatar
      };
    });

    const enrichedMembers = topMembers.map(member => {
      const user = userMap.get(member.id);
      return {
        ...member,
        username: user?.username || member.id,
        avatar: user?.avatar
      };
    });

    const stats: DashboardStats = {
      totalMembers,
      activeUsers,
      messagesToday,
      modActions,
      recentActivity: enrichedActivity,
      topMembers: enrichedMembers
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Database error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}