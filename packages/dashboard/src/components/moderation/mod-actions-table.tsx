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
import { formatDistanceToNow } from 'date-fns';

interface ModAction {
  id: number;
  type: string;
  user_id: string;
  moderator_id: string;
  reason: string;
  duration?: number;
  is_active: boolean;
  created_at: string;
}

export function ModActionsTable() {
  const { data: session } = useSession();
  const [actions, setActions] = useState<ModAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const response = await fetch('/api/moderation/actions', {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch moderation actions');
        }

        const data = await response.json();
        setActions(data.actions);
      } catch (error) {
        console.error('Error fetching moderation actions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchActions();
    }
  }, [session]);

  const handleRevokeAction = async (actionId: number) => {
    try {
      const response = await fetch(`/api/moderation/actions/${actionId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to revoke action');
      }

      // Refresh actions list
      const updatedActions = actions.map(action => 
        action.id === actionId ? { ...action, is_active: false } : action
      );
      setActions(updatedActions);
    } catch (error) {
      console.error('Error revoking action:', error);
    }
  };

  const getActionBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ban':
        return 'destructive';
      case 'kick':
        return 'default';
      case 'timeout':
        return 'warning';
      case 'warn':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading actions...</div>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Moderator</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actions.map((action) => (
            <TableRow key={action.id}>
              <TableCell>
                <Badge variant={getActionBadgeColor(action.type)}>
                  {action.type}
                </Badge>
              </TableCell>
              <TableCell>{action.user_id}</TableCell>
              <TableCell>{action.moderator_id}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {action.reason}
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <Badge variant={action.is_active ? "success" : "secondary"}>
                  {action.is_active ? "Active" : "Revoked"}
                </Badge>
              </TableCell>
              <TableCell>
                {action.is_active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeAction(action.id)}
                  >
                    Revoke
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
} 