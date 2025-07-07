'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DiscordUser } from "@/components/ui/discord-user";
import { Award, Trophy, Star, Zap } from "lucide-react";

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

export default function LevelingPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<LevelingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }

    const fetchLevelingData = async () => {
      try {
        const response = await fetch('/api/dashboard/leveling/stats', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch leveling data');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching leveling data:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchLevelingData();
    // Refresh data every minute
    const interval = setInterval(fetchLevelingData, 60000);
    return () => clearInterval(interval);
  }, [session, status]);

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Leveling Data</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Leveling System</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Level</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Level {loading ? '...' : stats?.topLevel || 0}</div>
              <p className="text-xs text-muted-foreground">Highest achieved level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total XP</CardTitle>
              <Star className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : `${(stats?.totalXp || 0).toLocaleString()}`}</div>
              <p className="text-xs text-muted-foreground">Combined server XP</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Zap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Users gaining XP today</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {loading ? (
                  <p className="text-center text-gray-500">Loading leaderboard...</p>
                ) : stats?.leaderboard.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-gray-400 dark:text-gray-600 w-8">
                        #{user.rank}
                      </span>
                      <DiscordUser
                        userId={user.id}
                        username={user.username}
                        avatarSize={40}
                      />
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium dark:text-gray-200">Level {user.level}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{user.xp.toLocaleString()} XP</span>
                      </div>
                      <Award className={`h-5 w-5 ${user.rank === 1 ? 'text-yellow-500' : user.rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}