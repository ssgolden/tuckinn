"use client";

import { Webhook, ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type WebhookEvent = {
  id: string;
  provider: string;
  eventType: string;
  eventId: string;
  receivedAt: string;
  processedAt: string | null;
};

const sampleEvents: WebhookEvent[] = [
  { id: "1", provider: "stripe", eventType: "checkout.session.completed", eventId: "evt_1abc", receivedAt: "2026-04-13T12:05:00Z", processedAt: "2026-04-13T12:05:01Z" },
  { id: "2", provider: "stripe", eventType: "payment_intent.created", eventId: "evt_2def", receivedAt: "2026-04-13T11:58:00Z", processedAt: "2026-04-13T11:58:01Z" },
  { id: "3", provider: "stripe", eventType: "checkout.session.expired", eventId: "evt_3ghi", receivedAt: "2026-04-13T11:30:00Z", processedAt: "2026-04-13T11:30:01Z" },
  { id: "4", provider: "stripe", eventType: "checkout.session.completed", eventId: "evt_4jkl", receivedAt: "2026-04-12T18:00:00Z", processedAt: "2026-04-12T18:00:02Z" },
];

const webhookEndpoints = [
  { url: "/api/webhooks/stripe", provider: "Stripe", description: "Receives checkout.session.completed, checkout.session.expired, payment_intent.* events" },
];

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">Configure and monitor webhook endpoints and event delivery.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Active Endpoints
          </CardTitle>
          <CardDescription>Webhook endpoints receiving external events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhookEndpoints.map((ep) => (
            <div key={ep.url} className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge>{ep.provider}</Badge>
                  <span className="font-mono text-sm">{ep.url}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => window.open(ep.url, "_blank")}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{ep.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Events
          </CardTitle>
          <CardDescription>Last webhook deliveries and processing status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Event ID</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Processed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleEvents.map((evt) => (
                <TableRow key={evt.id}>
                  <TableCell><Badge variant="outline">{evt.provider}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{evt.eventType}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{evt.eventId}</TableCell>
                  <TableCell className="text-sm">{new Date(evt.receivedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {evt.processedAt ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">Processed</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}