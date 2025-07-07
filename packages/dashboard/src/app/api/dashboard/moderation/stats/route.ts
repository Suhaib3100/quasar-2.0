import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { pool } from '@/lib/db';

interface ModAction {
  id: string;
  type: string;
  userId: string;
  moderatorId: string;
  reason: string;
  createdAt: string;
}

interface ModStats {
  totalWarnings: number;
  activeBans: number;
  modActions: number;
  recentActions: ModAction[];
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

    // Check if user has any of the moderator roles
    const hasModRole = member.roles.some((role: string) => modRoles.includes(role));
    
    // Log the permission check result
    console.log(`Permission check for user ${userId}: ${hasModRole ? 'Granted' : 'Denied'}`);
    
    return hasModRole;
  } catch (error) {
    console.error('Error checking moderator permissions:', error);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user has moderator permissions
    const isModerator = await checkModeratorPermissions(session.user.id);
    if (!isModerator) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    let stats: ModStats;
    
    try {
      // Get moderation stats
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const warningsResult = await pool.query(
        'SELECT COUNT(*) as count FROM mod_actions WHERE type = $1 AND created_at >= $2',
        ['warning', thirtyDaysAgo.toISOString()]
      );

      const activeBansResult = await pool.query(
        'SELECT COUNT(*) as count FROM mod_actions WHERE type = $1 AND is_active = true',
        ['ban']
      );

      const totalActionsResult = await pool.query(
        'SELECT COUNT(*) as count FROM mod_actions'
      );

      const recentActionsResult = await pool.query(
        'SELECT * FROM mod_actions ORDER BY created_at DESC LIMIT 50'
      );

      stats = {
        totalWarnings: parseInt(warningsResult.rows[0].count) || 0,
        activeBans: parseInt(activeBansResult.rows[0].count) || 0,
        modActions: parseInt(totalActionsResult.rows[0].count) || 0,
        recentActions: recentActionsResult.rows
      };
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Provide fallback data when database is unavailable
      stats = {
        totalWarnings: 0,
        activeBans: 0,
        modActions: 0,
        recentActions: []
      };
    }

    return NextResponse.json({
      stats,
      isAdmin: true // Since we've already verified moderator status
    });
  } catch (error) {
    console.error('Error in moderation stats API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}