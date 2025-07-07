'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Users, MessageSquare, Shield } from "lucide-react";
import { DiscordUser } from "@/components/ui/discord-user";

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      redirect("/auth/signin");
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats", {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'Failed to fetch stats');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session, status]);

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h2>
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
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Dashboard</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <h3 className="text-2xl font-bold dark:text-white">{stats?.totalMembers || 0}</h3>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <Activity className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <h3 className="text-2xl font-bold dark:text-white">{stats?.activeUsers || 0}</h3>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                <MessageSquare className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Messages Today</p>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <h3 className="text-2xl font-bold dark:text-white">{stats?.messagesToday || 0}</h3>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Mod Actions</p>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <h3 className="text-2xl font-bold dark:text-white">{stats?.modActions || 0}</h3>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold dark:text-white">Recent Activity</h3>
              <ScrollArea className="h-[300px] mt-4">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats?.recentActivity?.map((activity) => (
                      <div
                        key={`${activity.id}-${activity.timestamp}`}
                        className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-4">
                          <DiscordUser userId={activity.user} username={activity.user} />
                          <p className="text-sm text-muted-foreground">{activity.action}</p>
                        </div>
                        <time className="text-sm text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </time>
                      </div>
                    )) || <p className="text-sm text-gray-500">No recent activity</p>}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold dark:text-white">Top Members</h3>
              <ScrollArea className="h-[300px] mt-4">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats?.topMembers?.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-4">
                          <DiscordUser userId={member.id} username={member.username} />
                          <div className="flex flex-col">
                            <p className="text-sm font-medium dark:text-white">Level {member.level}</p>
                            <p className="text-xs text-muted-foreground">{member.messages.toLocaleString()} messages</p>
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-sm text-gray-500">No top members data</p>}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}