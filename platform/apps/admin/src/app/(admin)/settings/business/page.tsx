"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch, withAdminSession } from "@/lib/api";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Globe,
  Truck,
  Percent,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

type DaySchedule = {
  open: string;
  close: string;
  closed: boolean;
};

type BusinessSettings = {
  locationCode: string;
  locationName: string;
  currencyCode: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string | null;
  openingHours: Record<string, DaySchedule>;
  taxRate: number;
  deliveryFee: number;
  minimumDeliveryOrder: number;
  orderingCutoffMinutes: number;
  isOnlineOrderingEnabled: boolean;
  deliveryRadiusKm: number | null;
  isCurrentlyOpen: boolean;
};

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const DEFAULT_HOURS: Record<string, DaySchedule> = Object.fromEntries(
  DAYS.map(({ key }) => [
    key,
    key === "sat" || key === "sun"
      ? { open: "12:00", close: "22:00", closed: false }
      : { open: "09:00", close: "22:00", closed: false },
  ])
);

function formatPrice(amount: number) {
  return `€${Number(amount).toFixed(2)}`;
}

export default function BusinessSettingsPage() {
  const { session, updateSession } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [openingHours, setOpeningHours] = useState<Record<string, DaySchedule>>({ ...DEFAULT_HOURS });
  const [taxRate, setTaxRate] = useState("0");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [minimumDeliveryOrder, setMinimumDeliveryOrder] = useState("0");
  const [orderingCutoffMinutes, setOrderingCutoffMinutes] = useState("0");
  const [isOnlineOrderingEnabled, setIsOnlineOrderingEnabled] = useState(true);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [region, setRegion] = useState("");
  const [countryCode, setCountryCode] = useState("");

  const loadSettings = useCallback(async () => {
    if (!session) return;
    try {
      const data = await apiFetch<BusinessSettings>(
        "/settings/business?locationCode=main",
        undefined,
        session.accessToken
      );
      setSettings(data);
      setError(null);

      // Populate form
      if (data.openingHours && Object.keys(data.openingHours).length > 0) {
        setOpeningHours({
          ...DEFAULT_HOURS,
          ...data.openingHours,
        });
      }
      setTaxRate(String(data.taxRate));
      setDeliveryFee(String(data.deliveryFee));
      setMinimumDeliveryOrder(String(data.minimumDeliveryOrder));
      setOrderingCutoffMinutes(String(data.orderingCutoffMinutes));
      setIsOnlineOrderingEnabled(data.isOnlineOrderingEnabled);
      setDeliveryRadiusKm(data.deliveryRadiusKm != null ? String(data.deliveryRadiusKm) : "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setAddressLine1(data.addressLine1 || "");
      setAddressLine2(data.addressLine2 || "");
      setCity(data.city || "");
      setPostalCode(data.postalCode || "");
      setRegion(data.region || "");
      setCountryCode(data.countryCode || "");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      const dto: Record<string, unknown> = {
        openingHours,
        taxRate: parseFloat(taxRate) || 0,
        deliveryFee: parseFloat(deliveryFee) || 0,
        minimumDeliveryOrder: parseFloat(minimumDeliveryOrder) || 0,
        orderingCutoffMinutes: parseInt(orderingCutoffMinutes) || 0,
        isOnlineOrderingEnabled,
        deliveryRadiusKm: deliveryRadiusKm ? parseInt(deliveryRadiusKm) : null,
        phone: phone || null,
        email: email || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        postalCode: postalCode || null,
        region: region || null,
        countryCode: countryCode || null,
      };

      await withAdminSession(
        session,
        (token) =>
          apiFetch("/settings/business?locationCode=main", {
            method: "PATCH",
            body: JSON.stringify(dto),
          }, token),
        updateSession
      );

      toast.success("Business settings saved");
      await loadSettings();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function updateDay(key: string, field: keyof DaySchedule, value: string | boolean) {
    setOpeningHours((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading settings...
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/10">
        <CardContent className="pt-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 inline mr-1.5 align-text-bottom" />
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Settings</h1>
          <p className="text-muted-foreground">
            Manage opening hours, delivery, tax, and contact details for {settings?.locationName || "Tuckinn Proper"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {settings?.isCurrentlyOpen ? (
            <div className="flex items-center gap-1.5 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Currently Open
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-red-400">
              <XCircle className="h-4 w-4" />
              Currently Closed
            </div>
          )}
          <Button variant="outline" size="sm" onClick={loadSettings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Online Ordering Toggle */}
      <Card className="bg-[#111] border-border/40">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Settings className="h-4 w-4" />
                Online Ordering
              </div>
              <p className="text-xs text-muted-foreground">
                Disable to prevent new orders from being placed on the storefront. Kitchen can still update existing orders.
              </p>
            </div>
            <Switch
              checked={isOnlineOrderingEnabled}
              onCheckedChange={setIsOnlineOrderingEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Opening Hours */}
      <Card className="bg-[#111] border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Opening Hours
          </CardTitle>
          <CardDescription>
            Set the opening and closing times for each day. Close times after midnight (e.g. 02:00) automatically handle overnight schedules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const schedule = openingHours[key] || { open: "09:00", close: "22:00", closed: false };
            return (
              <div key={key} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium">{label}</div>
                <Switch
                  checked={!schedule.closed}
                  onCheckedChange={(checked) => updateDay(key, "closed", !checked)}
                />
                {!schedule.closed ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={schedule.open}
                      onChange={(e) => updateDay(key, "open", e.target.value)}
                      className="w-32 bg-[#1a1a1a] border-border/50 text-sm"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                      type="time"
                      value={schedule.close}
                      onChange={(e) => updateDay(key, "close", e.target.value)}
                      className="w-32 bg-[#1a1a1a] border-border/50 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Closed</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Ordering Cutoff */}
      <Card className="bg-[#111] border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Ordering Cutoff
          </CardTitle>
          <CardDescription>
            How many minutes before closing to stop accepting new orders. Set to 0 to accept orders until closing time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="1440"
              value={orderingCutoffMinutes}
              onChange={(e) => setOrderingCutoffMinutes(e.target.value)}
              className="w-32 bg-[#1a1a1a] border-border/50"
            />
            <span className="text-sm text-muted-foreground">minutes before close</span>
          </div>
        </CardContent>
      </Card>

      {/* Tax & Fees */}
      <Card className="bg-[#111] border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Tax & Fees
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tax Rate (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="bg-[#1a1a1a] border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Delivery Fee ({settings?.currencyCode || "EUR"})</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="bg-[#1a1a1a] border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Min. Delivery Order ({settings?.currencyCode || "EUR"})</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={minimumDeliveryOrder}
                onChange={(e) => setMinimumDeliveryOrder(e.target.value)}
                className="bg-[#1a1a1a] border-border/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Zone */}
      <Card className="bg-[#111] border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Delivery Zone
          </CardTitle>
          <CardDescription>
            Maximum delivery radius in kilometers. Leave empty for unlimited delivery range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="500"
              value={deliveryRadiusKm}
              onChange={(e) => setDeliveryRadiusKm(e.target.value)}
              placeholder="Unlimited"
              className="w-32 bg-[#1a1a1a] border-border/50"
            />
            <span className="text-sm text-muted-foreground">km radius</span>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-[#111] border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Phone, email, and address shown to customers on the storefront.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 900 000 000"
                className="bg-[#1a1a1a] border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@tuckinn.com"
                className="bg-[#1a1a1a] border-border/50"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Address Line 1</label>
            <Input
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="123 Main Street"
              className="bg-[#1a1a1a] border-border/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Address Line 2</label>
            <Input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Unit 4B"
              className="bg-[#1a1a1a] border-border/50"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">City</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Madrid"
                className="bg-[#1a1a1a] border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Region</label>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Comunidad de Madrid"
                className="bg-[#1a1a1a] border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Postal Code</label>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="28001"
                className="bg-[#1a1a1a] border-border/50"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Country Code
            </label>
            <Input
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              placeholder="ES"
              className="w-32 bg-[#1a1a1a] border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pb-8">
        <Button size="lg" disabled={saving} onClick={handleSave}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}