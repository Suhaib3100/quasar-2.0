'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface DiscordUserProps {
  userId: string;
  username: string;
  avatar?: string | null;
  avatarSize?: number;
  className?: string;
}

export function DiscordUser({ userId, username, avatar, avatarSize = 32, className }: DiscordUserProps) {
  // Use user's avatar if available, otherwise fall back to default avatar
  const avatarIndex = userId && !isNaN(Number(userId)) ? Math.abs(Number(userId)) % 5 : 0;
  const defaultAvatarUrl = `https://cdn.discordapp.com/embed/avatars/${avatarIndex}.png`;
  const avatarUrl = avatar
    ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=${avatarSize}`
    : defaultAvatarUrl;

  return (
    <div className={cn('flex items-center gap-3', className)} key={userId}>
      <div className="relative" style={{ width: avatarSize, height: avatarSize }}>
        <Image
          src={avatarUrl}
          alt={`${username}'s Discord avatar`}
          width={avatarSize}
          height={avatarSize}
          className="rounded-full"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = defaultAvatarUrl;
          }}
        />
      </div>
      <div className="flex flex-col">
        <span className="font-medium text-sm dark:text-white">{username}</span>
      </div>
    </div>
  );
}