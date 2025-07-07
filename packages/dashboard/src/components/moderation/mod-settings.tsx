'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

interface ModSettings {
  auto_mod: boolean;
  spam_protection: boolean;
  link_filter: boolean;
  invite_filter: boolean;
  caps_filter: boolean;
  emoji_spam_filter: boolean;
  mention_spam_filter: boolean;
  banned_words: string[];
  ignored_channels: string[];
  ignored_roles: string[];
  max_mentions: number;
  max_emojis: number;
  max_caps_percentage: number;
  welcome_message: string;
  log_channel: string;
}

export function ModSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<ModSettings>({
    auto_mod: true,
    spam_protection: true,
    link_filter: true,
    invite_filter: true,
    caps_filter: true,
    emoji_spam_filter: true,
    mention_spam_filter: true,
    banned_words: [],
    ignored_channels: [],
    ignored_roles: [],
    max_mentions: 5,
    max_emojis: 10,
    max_caps_percentage: 70,
    welcome_message: '',
    log_channel: '',
  });
  const [newBannedWord, setNewBannedWord] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/moderation/settings', {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch moderation settings');
        }

        const data = await response.json();
        setSettings(data.settings);
      } catch (error) {
        console.error('Error fetching moderation settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchSettings();
    }
  }, [session]);

  const handleUpdateSettings = async () => {
    try {
      const response = await fetch('/api/moderation/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update moderation settings');
      }
    } catch (error) {
      console.error('Error updating moderation settings:', error);
    }
  };

  const handleAddBannedWord = () => {
    if (newBannedWord.trim() && !settings.banned_words.includes(newBannedWord.trim())) {
      setSettings({
        ...settings,
        banned_words: [...settings.banned_words, newBannedWord.trim()]
      });
      setNewBannedWord('');
    }
  };

  const handleRemoveBannedWord = (word: string) => {
    setSettings({
      ...settings,
      banned_words: settings.banned_words.filter(w => w !== word)
    });
  };

  if (loading) {
    return <div className="text-center py-4">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure basic moderation features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto_mod">Auto Moderation</Label>
            <Switch
              id="auto_mod"
              checked={settings.auto_mod}
              onCheckedChange={(checked) => setSettings({ ...settings, auto_mod: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="spam_protection">Spam Protection</Label>
            <Switch
              id="spam_protection"
              checked={settings.spam_protection}
              onCheckedChange={(checked) => setSettings({ ...settings, spam_protection: checked })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="log_channel">Log Channel</Label>
            <Input
              id="log_channel"
              value={settings.log_channel}
              onChange={(e) => setSettings({ ...settings, log_channel: e.target.value })}
              placeholder="Channel ID for moderation logs"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Filters</CardTitle>
          <CardDescription>
            Configure content filtering rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="link_filter">Link Filter</Label>
            <Switch
              id="link_filter"
              checked={settings.link_filter}
              onCheckedChange={(checked) => setSettings({ ...settings, link_filter: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="invite_filter">Invite Filter</Label>
            <Switch
              id="invite_filter"
              checked={settings.invite_filter}
              onCheckedChange={(checked) => setSettings({ ...settings, invite_filter: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="caps_filter">Caps Filter</Label>
            <Switch
              id="caps_filter"
              checked={settings.caps_filter}
              onCheckedChange={(checked) => setSettings({ ...settings, caps_filter: checked })}
            />
          </div>
          {settings.caps_filter && (
            <div className="grid gap-2">
              <Label htmlFor="max_caps_percentage">Maximum Caps Percentage</Label>
              <Input
                id="max_caps_percentage"
                type="number"
                min="0"
                max="100"
                value={settings.max_caps_percentage}
                onChange={(e) => setSettings({ ...settings, max_caps_percentage: parseInt(e.target.value) })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spam Protection</CardTitle>
          <CardDescription>
            Configure spam detection settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emoji_spam_filter">Emoji Spam Filter</Label>
            <Switch
              id="emoji_spam_filter"
              checked={settings.emoji_spam_filter}
              onCheckedChange={(checked) => setSettings({ ...settings, emoji_spam_filter: checked })}
            />
          </div>
          {settings.emoji_spam_filter && (
            <div className="grid gap-2">
              <Label htmlFor="max_emojis">Maximum Emojis</Label>
              <Input
                id="max_emojis"
                type="number"
                min="1"
                value={settings.max_emojis}
                onChange={(e) => setSettings({ ...settings, max_emojis: parseInt(e.target.value) })}
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label htmlFor="mention_spam_filter">Mention Spam Filter</Label>
            <Switch
              id="mention_spam_filter"
              checked={settings.mention_spam_filter}
              onCheckedChange={(checked) => setSettings({ ...settings, mention_spam_filter: checked })}
            />
          </div>
          {settings.mention_spam_filter && (
            <div className="grid gap-2">
              <Label htmlFor="max_mentions">Maximum Mentions</Label>
              <Input
                id="max_mentions"
                type="number"
                min="1"
                value={settings.max_mentions}
                onChange={(e) => setSettings({ ...settings, max_mentions: parseInt(e.target.value) })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banned Words</CardTitle>
          <CardDescription>
            Manage banned words and phrases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newBannedWord}
              onChange={(e) => setNewBannedWord(e.target.value)}
              placeholder="Add a banned word or phrase"
            />
            <Button onClick={handleAddBannedWord}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="flex flex-wrap gap-2">
              {settings.banned_words.map((word) => (
                <Badge key={word} variant="secondary" className="flex items-center gap-1">
                  {word}
                  <button
                    onClick={() => handleRemoveBannedWord(word)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Welcome Message</CardTitle>
          <CardDescription>
            Configure the welcome message for new members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Textarea
              value={settings.welcome_message}
              onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
              placeholder="Enter welcome message (supports markdown)"
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleUpdateSettings} className="w-full">
        Save All Settings
      </Button>
    </div>
  );
} 