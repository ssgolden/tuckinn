"use client";

import Link from "next/link";
import { User, Webhook, Bell } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SettingsCard = {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
};

const settings: SettingsCard[] = [
  {
    title: "Profile & Password",
    description: "Manage your account details and change your login credentials.",
    icon: User,
    href: "/settings/profile",
  },
  {
    title: "Webhooks",
    description: "Configure webhook endpoints and monitor event delivery.",
    icon: Webhook,
    href: "/settings/webhooks",
  },
  {
    title: "Notifications",
    description: "Configure notification channels for order events (email, SMS, push, webhook).",
    icon: Bell,
    href: "/notifications",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account, integrations, and preferences.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((s) => (
          <Link key={s.href + s.title} href={s.href}>
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <s.icon className="h-4 w-4" />
                  {s.title}
                </CardTitle>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}