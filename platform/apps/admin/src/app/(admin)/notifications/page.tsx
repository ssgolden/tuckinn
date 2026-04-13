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

type Channel = {
  id: string;
  type: "email" | "sms" | "push" | "webhook";
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ElementType;
  config: Record<string, string>;
};

const channels: Channel[] = [
  { id: "1", type: "email", label: "Email", description: "Order confirmations, status updates via SendGrid/SMTP", enabled: true, icon: Mail, config: { provider: "SendGrid", from: "orders@tuckinn.com" } },
  { id: "2", type: "sms", label: "SMS", description: "Order ready notifications via Twilio", enabled: false, icon: MessageSquare, config: { provider: "Twilio", from: "+34600000000" } },
  { id: "3", type: "push", label: "Push", description: "Browser push notifications for kitchen staff", enabled: false, icon: Smartphone, config: { provider: "Web Push API" } },
  { id: "4", type: "webhook", label: "Webhook", description: "POST events to external systems (POS, delivery, analytics)", enabled: true, icon: Webhook, config: { url: "https://hooks.example.com/tuckinn" } },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Configure notification channels for order events.</p>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4 text-sm text-amber-800">
          ⚠️ Notification settings are stored in config. API management coming soon.
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((ch) => (
          <Card key={ch.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ch.icon className="h-4 w-4" />
                  {ch.label}
                </CardTitle>
                <Switch checked={ch.enabled} disabled />
              </div>
              <CardDescription>{ch.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {Object.entries(ch.config).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{k}</span>
                    <span className="font-mono text-xs">{v}</span>
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