'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from 'date-fns';

interface Warning {
  id: number;
  user_id: string;
  username: string;
  reason: string;
  created_at: string;
  created_by: string;
  moderator_name: string;
  is_active: boolean;
}

interface WarningSettings {
  max_warnings: number;
  auto_timeout: boolean;
  timeout_duration: number;
  auto_kick: boolean;
  auto_ban: boolean;
}

export function WarningSystem() {
  const { data: session } = useSession();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [settings, setSettings] = useState<WarningSettings>({
    max_warnings: 3,
    auto_timeout: true,
    timeout_duration: 60,
    auto_kick: false,
    auto_ban: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [warningsResponse, settingsResponse] = await Promise.all([
          fetch('/api/moderation/warnings', {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`
            }
          }),
          fetch('/api/moderation/warning-settings', {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`
            }
          })
        ]);

        if (!warningsResponse.ok || !settingsResponse.ok) {
          throw new Error('Failed to fetch warning data');
        }

        const [warningsData, settingsData] = await Promise.all([
          warningsResponse.json(),
          settingsResponse.json()
        ]);

        setWarnings(warningsData.warnings);
        setSettings(settingsData.settings);
      } catch (error) {
        console.error('Error fetching warning data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session]);

  const handleUpdateSettings = async () => {
    try {
      const response = await fetch('/api/moderation/warning-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update warning settings');
      }
    } catch (error) {
      console.error('Error updating warning settings:', error);
    }
  };

  const handleRemoveWarning = async (warningId: number) => {
    try {
      const response = await fetch(`/api/moderation/warnings/${warningId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove warning');
      }

      setWarnings(warnings.filter(warning => warning.id !== warningId));
    } catch (error) {
      console.error('Error removing warning:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading warning system...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Warning Settings</CardTitle>
            <CardDescription>
              Configure automated actions for user warnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="max_warnings">Maximum Warnings</Label>
              <Input
                id="max_warnings"
                type="number"
                min="1"
                value={settings.max_warnings}
                onChange={(e) => setSettings({ ...settings, max_warnings: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto_timeout">Auto Timeout</Label>
              <Switch
                id="auto_timeout"
                checked={settings.auto_timeout}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_timeout: checked })}
              />
            </div>
            {settings.auto_timeout && (
              <div className="grid gap-2">
                <Label htmlFor="timeout_duration">Timeout Duration (minutes)</Label>
                <Input
                  id="timeout_duration"
                  type="number"
                  min="1"
                  value={settings.timeout_duration}
                  onChange={(e) => setSettings({ ...settings, timeout_duration: parseInt(e.target.value) })}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="auto_kick">Auto Kick</Label>
              <Switch
                id="auto_kick"
                checked={settings.auto_kick}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_kick: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto_ban">Auto Ban</Label>
              <Switch
                id="auto_ban"
                checked={settings.auto_ban}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_ban: checked })}
              />
            </div>
            <Button onClick={handleUpdateSettings}>Save Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warning Statistics</CardTitle>
            <CardDescription>
              Overview of warning system usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <div className="text-sm font-medium">Active Warnings</div>
                <div className="text-2xl font-bold">
                  {warnings.filter(w => w.is_active).length}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Total Warnings</div>
                <div className="text-2xl font-bold">{warnings.length}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Users with Warnings</div>
                <div className="text-2xl font-bold">
                  {new Set(warnings.map(w => w.user_id)).size}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warning History</CardTitle>
          <CardDescription>
            View and manage user warnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Moderator</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warnings.map((warning) => (
                  <TableRow key={warning.id}>
                    <TableCell>{warning.username}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {warning.reason}
                    </TableCell>
                    <TableCell>{warning.moderator_name}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(warning.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={warning.is_active ? "default" : "secondary"}>
                        {warning.is_active ? "Active" : "Removed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {warning.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWarning(warning.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 