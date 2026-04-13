"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch, withAdminSession } from "@/lib/api";
import { Bell, Mail, MessageSquare, Smartphone, Webhook, Loader2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

type ChannelConfig = {
  type: "email" | "sms" | "push" | "webhook";
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  fields: { key: string; label: string; value: string; secret?: boolean }[];
};

type NotificationConfig = {
  channels: ChannelConfig[];
};

const channelDefaults: Omit<ChannelConfig, "enabled" | "fields">[] = [
  {
    type: "email",
    label: "Email",
    description: "Order confirmations, status updates via SendGrid/SMTP",
    icon: Mail,
  },
  {
    type: "sms",
    label: "SMS",
    description: "Order ready notifications via Twilio",
    icon: MessageSquare,
  },
  {
    type: "push",
    label: "Push",
    description: "Browser push notifications for kitchen staff",
    icon: Smartphone,
  },
  {
    type: "webhook",
    label: "Webhook",
    description: "POST events to external systems (POS, delivery, analytics)",
    icon: Webhook,
  },
];

const defaultFields: Record<string, { key: string; label: string; secret?: boolean }[]> = {
  email: [
    { key: "provider", label: "Provider" },
    { key: "from", label: "From Address" },
  ],
  sms: [
    { key: "provider", label: "Provider" },
    { key: "from", label: "From Number" },
    { key: "sid", label: "Account SID", secret: true },
  ],
  push: [
    { key: "provider", label: "Provider" },
    { key: "vapidKey", label: "VAPID Public Key" },
  ],
  webhook: [
    { key: "url", label: "Endpoint URL" },
    { key: "secret", label: "Signing Secret", secret: true },
  ],
};

function buildChannelsFromApi(apiChannels: Array<{ type: string; enabled: boolean; fields: Array<{ key: string; value: string }> }>): ChannelConfig[] {
  return channelDefaults.map((def) => {
    const apiChannel = apiChannels.find((c) => c.type === def.type);
    const fields = (defaultFields[def.type] || []).map((fieldDef) => {
      const apiField = apiChannel?.fields?.find((f) => f.key === fieldDef.key);
      return {
        ...fieldDef,
        value: apiField?.value ?? "",
      };
    });
    return {
      ...def,
      enabled: apiChannel?.enabled ?? false,
      fields,
    };
  });
}

function channelsToApi(channels: ChannelConfig[]) {
  return {
    channels: channels.map((ch) => ({
      type: ch.type,
      enabled: ch.enabled,
      fields: ch.fields.map((f) => ({ key: f.key, value: f.value })),
    })),
  };
}

export default function NotificationsPage() {
  const { session, updateSession } = useAuth();
  const [channels, setChannels] = useState<ChannelConfig[]>(() =>
    channelDefaults.map((def) => ({
      ...def,
      enabled: false,
      fields: (defaultFields[def.type] || []).map((f) => ({ ...f, value: "" })),
    }))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<NotificationConfig>("/notifications/config", undefined, session?.accessToken);
      if (data?.channels) {
        setChannels(buildChannelsFromApi(data.channels));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load notification config";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      await withAdminSession(session, (token) =>
        apiFetch("/notifications/config", {
          method: "PATCH",
          body: JSON.stringify(channelsToApi(channels)),
        }, token), updateSession
      );
      toast.success("Notification settings saved.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  function toggleChannel(type: string) {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.type === type ? { ...ch, enabled: !ch.enabled } : ch
      )
    );
  }

  function updateField(type: string, fieldKey: string, value: string) {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.type === type
          ? { ...ch, fields: ch.fields.map((f) => f.key === fieldKey ? { ...f, value } : f) }
          : ch
      )
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Configure notification channels for order events.</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12" role="status" aria-live="polite">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Configure notification channels for order events.</p>
        </div>
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="pt-4 text-sm text-amber-400">
            <AlertTriangle className="h-4 w-4 inline mr-1.5 align-text-bottom" />{error}
            <Button variant="outline" size="sm" className="ml-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={loadConfig}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Configure notification channels for order events.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((ch) => (
          <Card key={ch.type}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ch.icon className="h-4 w-4" />
                  {ch.label}
                </CardTitle>
                <Switch checked={ch.enabled} onCheckedChange={() => toggleChannel(ch.type)} aria-label={`Toggle ${ch.label}`} />
              </div>
              <CardDescription>{ch.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {ch.fields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{f.label}</Label>
                    <Input
                      value={f.value}
                      onChange={(e) => updateField(ch.type, f.key, e.target.value)}
                      type={f.secret && f.value ? "password" : "text"}
                      placeholder={f.secret ? "••••••••" : `Enter ${f.label}`}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Badge variant={ch.enabled ? "default" : "secondary"}>
                  {ch.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}