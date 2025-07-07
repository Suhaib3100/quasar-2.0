import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

async function checkAdminPermissions(userId: string): Promise<boolean> {
  try {
    if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD_ID) {
      throw new Error('Missing Discord configuration');
    }

    const response = await fetch(`https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${userId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch member roles');
    }

    const member = await response.json();
    const modRoles = [
      process.env.DISCORD_ADMIN_ROLE_ID,
      process.env.DISCORD_MOD_ROLE_ID
    ].filter(Boolean);

    return member.roles.some((role: string) => modRoles.includes(role));
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const isAdmin = await checkAdminPermissions(session.user.id);

    return NextResponse.json({
      isAdmin,
      userId: session.user.id
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}