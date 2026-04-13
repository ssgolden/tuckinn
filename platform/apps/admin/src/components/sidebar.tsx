"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Armchair,
  FileText,
  Bell,
  Settings,
  User,
  Webhook,
  LogOut,
  ChevronDown,
  Menu,
  FolderOpen,
  ShoppingBag,
  SlidersHorizontal,
  Home,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useState, useMemo, Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// ─── Nav config ─────────────────────────────────────

type NavGroup = {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: { label: string; href: string; icon: React.ElementType }[];
};

const NAV: NavGroup[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  {
    label: "Catalog",
    icon: Package,
    children: [
      { label: "Categories", href: "/catalog/categories", icon: FolderOpen },
      { label: "Products", href: "/catalog/products", icon: ShoppingBag },
      { label: "Modifiers", href: "/catalog/modifiers", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Orders",
    icon: ClipboardList,
    href: "/orders",
  },
  { label: "Tables", icon: Armchair, href: "/tables" },
  { label: "Content", icon: FileText, href: "/content" },
  { label: "Notifications", icon: Bell, href: "/notifications" },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "Profile", href: "/settings/profile", icon: User },
      { label: "Webhooks", href: "/settings/webhooks", icon: Webhook },
    ],
  },
];

// ─── Breadcrumb route map ───────────────────────────

const BREADCRUMB_MAP: Record<string, string> = {
  catalog: "Catalog",
  categories: "Categories",
  products: "Products",
  modifiers: "Modifiers",
  orders: "Orders",
  tables: "Tables",
  content: "Content",
  notifications: "Notifications",
  settings: "Settings",
  profile: "Profile",
  webhooks: "Webhooks",
};

// ─── Active state helpers ───────────────────────────

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

// ─── Breadcrumbs ────────────────────────────────────

function Breadcrumbs() {
  const pathname = usePathname();

  const crumbs = useMemo(() => {
    type Crumb = { label: string; href: string; isLast: boolean };

    if (pathname === "/") return [{ label: "Home", href: "/", isLast: true }] as Crumb[];

    const segments = pathname.split("/").filter(Boolean);
    const items: Crumb[] = [{ label: "Home", href: "/", isLast: false }];

    for (let i = 0; i < segments.length; i++) {
      const href = "/" + segments.slice(0, i + 1).join("/");
      const label = BREADCRUMB_MAP[segments[i]] ?? segments[i];
      items.push({ label, href, isLast: i === segments.length - 1 });
    }

    return items;
  }, [pathname]);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, i) => (
        <Fragment key={crumb.href + crumb.label}>
          {i > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {crumb.isLast ? (
            <span className="text-foreground font-medium truncate" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {i === 0 ? (
                <Home className="h-3.5 w-3.5" />
              ) : (
                crumb.label
              )}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

// ─── Nav items ──────────────────────────────────────

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    // Auto-expand groups that contain the active path
    return NAV.filter(
      (item) =>
        item.children?.some((c) => isActivePath(pathname, c.href))
    ).map((item) => item.label);
  });

  function toggleGroup(label: string) {
    setOpenGroups((prev) =>
      prev.includes(label)
        ? prev.filter((g) => g !== label)
        : [...prev, label]
    );
  }

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.map((item) => {
        if (item.children) {
          const isOpen = openGroups.includes(item.label);
          const anyChildActive = item.children.some((c) =>
            isActivePath(pathname, c.href)
          );
          return (
            <Collapsible
              key={item.label}
              open={isOpen}
              onOpenChange={() => toggleGroup(item.label)}
            >
              <CollapsibleTrigger
                aria-expanded={isOpen}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 ${
                  anyChildActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 pt-0.5 space-y-0.5">
                {item.children.map((child) => {
                  const active = isActivePath(pathname, child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-brand/20 text-brand font-medium"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <child.icon className="h-3.5 w-3.5" />
                      {child.label}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        }

        const active = isActivePath(pathname, item.href!);
        return (
          <Link
            key={item.label}
            href={item.href!}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand/20 text-brand"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Role badge variant ─────────────────────────────

function roleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  if (role === "admin") return "default";
  if (role === "manager") return "secondary";
  return "outline";
}

// ─── Sidebar content (shared between mobile & desktop) ──

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { session, logout } = useAuth();
  const user = session?.user;

  const firstInitial = useMemo(() => {
    if (!user?.firstName) return "?";
    return user.firstName[0].toUpperCase();
  }, [user]);

  const displayRole = useMemo(() => {
    if (!user?.roles?.length) return "Staff";
    const role = user.roles[0];
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }, [user]);

  const roleKey = useMemo(() => {
    if (!user?.roles?.length) return "staff";
    return user.roles[0].toLowerCase();
  }, [user]);

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a] text-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/30">
        <div className="h-9 w-9 rounded-lg bg-brand flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">TP</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-tight truncate">
            Tuckinn Proper
          </h1>
          <p className="text-xs text-muted-foreground">Operations Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <NavItems onNavigate={onNavigate} />
      </div>

      <Separator className="bg-border/30" />

      {/* User / Logout */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar size="sm">
            <AvatarFallback className="bg-brand/20 text-brand text-xs font-semibold">
              {firstInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <Badge
              variant={roleBadgeVariant(roleKey)}
              className="mt-0.5 text-[10px] h-4 px-1.5 font-medium"
            >
              {displayRole}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => {
            logout();
            onNavigate?.();
          }}
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

// ─── Main sidebar export ────────────────────────────

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button — visible below lg breakpoint */}
      <div className="lg:hidden fixed top-3 left-3 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Open navigation menu" className="bg-[#0a0a0a] border-border/50 text-foreground hover:bg-muted" />}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation menu</span>
          </SheetTrigger>
          <SheetContent side="left" showCloseButton={false} className="w-72 p-0 bg-[#0a0a0a] border-border/30">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-64 border-r border-border/30 bg-[#0a0a0a] flex-col shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}

export { Breadcrumbs };