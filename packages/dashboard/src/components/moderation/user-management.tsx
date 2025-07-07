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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from 'date-fns';

interface ServerMember {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  roles: string[];
  joined_at: string;
  status: 'online' | 'offline' | 'idle' | 'dnd';
}

interface ModAction {
  type: 'warn' | 'timeout' | 'kick' | 'ban';
  reason: string;
  duration?: number;
}

export function UserManagement() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<ServerMember | null>(null);
  const [actionType, setActionType] = useState<ModAction['type'] | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [timeoutDuration, setTimeoutDuration] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/moderation/members', {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch server members');
        }

        const data = await response.json();
        setMembers(data.members);
      } catch (error) {
        console.error('Error fetching server members:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchMembers();
    }
  }, [session]);

  const handleModAction = async () => {
    if (!selectedMember || !actionType || !actionReason) return;

    try {
      const response = await fetch('/api/moderation/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          user_id: selectedMember.id,
          type: actionType,
          reason: actionReason,
          duration: actionType === 'timeout' ? parseInt(timeoutDuration) : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to perform moderation action');
      }

      // Reset form
      setSelectedMember(null);
      setActionType(null);
      setActionReason('');
      setTimeoutDuration('');
    } catch (error) {
      console.error('Error performing moderation action:', error);
    }
  };

  const getStatusColor = (status: ServerMember['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'dnd':
        return 'bg-red-500';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading members...</div>;
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                    </div>
                    <div>
                      <div className="font-medium">{member.username}</div>
                      <div className="text-sm text-muted-foreground">
                        #{member.discriminator}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {member.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setActionType('warn');
                          }}
                        >
                          Warn
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Warn User</DialogTitle>
                          <DialogDescription>
                            Issue a warning to {selectedMember?.username}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Input
                              id="reason"
                              value={actionReason}
                              onChange={(e) => setActionReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleModAction}>Issue Warning</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setActionType('timeout');
                          }}
                        >
                          Timeout
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Timeout User</DialogTitle>
                          <DialogDescription>
                            Temporarily mute {selectedMember?.username}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                              id="duration"
                              type="number"
                              min="1"
                              value={timeoutDuration}
                              onChange={(e) => setTimeoutDuration(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Input
                              id="reason"
                              value={actionReason}
                              onChange={(e) => setActionReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleModAction}>Apply Timeout</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setActionType('kick');
                          }}
                        >
                          Kick
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Kick User</DialogTitle>
                          <DialogDescription>
                            Remove {selectedMember?.username} from the server
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Input
                              id="reason"
                              value={actionReason}
                              onChange={(e) => setActionReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleModAction}>Confirm Kick</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => {
                            setSelectedMember(member);
                            setActionType('ban');
                          }}
                        >
                          Ban
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ban User</DialogTitle>
                          <DialogDescription>
                            Permanently ban {selectedMember?.username} from the server
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Input
                              id="reason"
                              value={actionReason}
                              onChange={(e) => setActionReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={handleModAction}
                          >
                            Confirm Ban
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
} 