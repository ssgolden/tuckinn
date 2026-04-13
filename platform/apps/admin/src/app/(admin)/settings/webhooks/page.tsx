"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch, withAdminSession } from "@/lib/api";
import { Webhook, ExternalLink, Clock, Loader2, AlertTriangle, Inbox } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { useState, useEffect, type FormEvent } from "react";

type WebhookEvent = {
  id: string;
  provider: string;
  eventType: string;
  eventId: string;
  receivedAt: string;
  processedAt: string | null;
};

type WebhookConfig = {
  endpointUrl: string;
  events: WebhookEvent[];
};

const defaultProviders = [
  { url: "/api/webhooks/stripe", provider: "Stripe", description: "Receives checkout.session.completed, checkout.session.expired, payment_intent.* events" },
];

export default function WebhooksPage() {
  const { session, updateSession } = useAuth();
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endpointUrl, setEndpointUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadConfig() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<WebhookConfig>("/webhooks/config", undefined, session?.accessToken);
      setConfig(data);
      setEndpointUrl(data.endpointUrl || "");
      setEvents(data.events || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load webhook config";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadConfig(); }, [session]);

  async function handleSaveEndpoint(e: FormEvent) {
    e.preventDefault();
    if (!session || !endpointUrl.trim()) {
      toast.error("Endpoint URL cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      await withAdminSession(session, (token) =>
        apiFetch("/webhooks/config", {
          method: "PATCH",
          body: JSON.stringify({ endpointUrl: endpointUrl.trim() }),
        }, token), updateSession
      );
      toast.success("Webhook endpoint updated.");
      loadConfig();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update endpoint.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">Configure and monitor webhook endpoints and event delivery.</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">Configure and monitor webhook endpoints and event delivery.</p>
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
        <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">Configure and monitor webhook endpoints and event delivery.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Endpoint
          </CardTitle>
          <CardDescription>URL where webhook events will be delivered.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveEndpoint} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="endpoint-url">Endpoint URL</Label>
              <Input
                id="endpoint-url"
                type="url"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://example.com/webhooks"
                className="font-mono text-sm"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Update Endpoint"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Active Endpoints
          </CardTitle>
          <CardDescription>Webhook endpoints receiving external events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {defaultProviders.map((ep) => (
            <div key={ep.url} className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge>{ep.provider}</Badge>
                  <span className="font-mono text-sm">{ep.url}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => window.open(ep.url, "_blank")} aria-label={`Open ${ep.provider} endpoint`}>
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
          {events.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No events yet"
              description="No webhook events received yet. Events will appear here when they arrive."
            />
          ) : (
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
                {events.map((evt) => (
                  <TableRow key={evt.id}>
                    <TableCell><Badge variant="outline">{evt.provider}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{evt.eventType}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{evt.eventId}</TableCell>
                    <TableCell className="text-sm">{new Date(evt.receivedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {evt.processedAt ? (
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-400">Processed</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}