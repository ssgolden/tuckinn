"use client";

import { Bell, Mail, MessageSquare, Smartphone, Webhook } from "lucide-react";
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
import { useState } from "react";
import { toast } from "sonner";

type ChannelConfig = {
  type: "email" | "sms" | "push" | "webhook";
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  fields: { key: string; label: string; value: string; secret?: boolean }[];
};

const defaultChannels: ChannelConfig[] = [
  {
    type: "email",
    label: "Email",
    description: "Order confirmations, status updates via SendGrid/SMTP",
    enabled: true,
    icon: Mail,
    fields: [
      { key: "provider", label: "Provider", value: "SendGrid" },
      { key: "from", label: "From Address", value: "orders@tuckinn.com" },
    ],
  },
  {
    type: "sms",
    label: "SMS",
    description: "Order ready notifications via Twilio",
    enabled: false,
    icon: MessageSquare,
    fields: [
      { key: "provider", label: "Provider", value: "Twilio" },
      { key: "from", label: "From Number", value: "" },
      { key: "sid", label: "Account SID", value: "", secret: true },
    ],
  },
  {
    type: "push",
    label: "Push",
    description: "Browser push notifications for kitchen staff",
    enabled: false,
    icon: Smartphone,
    fields: [
      { key: "provider", label: "Provider", value: "Web Push API" },
      { key: "vapidKey", label: "VAPID Public Key", value: "" },
    ],
  },
  {
    type: "webhook",
    label: "Webhook",
    description: "POST events to external systems (POS, delivery, analytics)",
    enabled: true,
    icon: Webhook,
    fields: [
      { key: "url", label: "Endpoint URL", value: "" },
      { key: "secret", label: "Signing Secret", value: "", secret: true },
    ],
  },
];

export default function NotificationsPage() {
  const [channels, setChannels] = useState(defaultChannels);

  function toggleChannel(type: string) {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.type === type ? { ...ch, enabled: !ch.enabled } : ch
      )
    );
    toast.info("Notification channel settings are saved in environment configuration.");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Configure notification channels for order events.</p>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4 text-sm text-blue-800">
          Notification channel configuration is managed via environment variables. Changes here are saved to your local session for reference.
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((ch) => (
          <Card key={ch.type}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ch.icon className="h-4 w-4" />
                  {ch.label}
                </CardTitle>
                <Switch checked={ch.enabled} onCheckedChange={() => toggleChannel(ch.type)} />
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
    </div>
  );
}