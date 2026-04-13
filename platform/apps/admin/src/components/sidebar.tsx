"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingBag,
  SlidersHorizontal,
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
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavGroup = {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: { label: string; href: string }[];
};

const NAV: NavGroup[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  {
    label: "Catalog",
    icon: Package,
    children: [
      { label: "Categories", href: "/catalog/categories" },
      { label: "Products", href: "/catalog/products" },
      { label: "Modifiers", href: "/catalog/modifiers" },
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
      { label: "Profile", href: "/settings/profile" },
      { label: "Webhooks", href: "/settings/webhooks" },
    ],
  },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>(["Catalog"]);

  function toggleGroup(label: string) {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="flex flex-col gap-1 px-2">
      {NAV.map((item) => {
        if (item.children) {
          const isOpen = openGroups.includes(item.label);
          const anyChildActive = item.children.some((c) => isActive(c.href));
          return (
            <Collapsible key={item.label} open={isOpen} onOpenChange={() => toggleGroup(item.label)}>
              <CollapsibleTrigger
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  anyChildActive ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 pt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isActive(child.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {child.label}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href!}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
              isActive(item.href!)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
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

export function Sidebar() {
  const { session, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-3 left-3 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger render={<Button variant="outline" size="icon" />}>
              <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-64 border-r bg-sidebar flex-col">
        <SidebarContent />
      </aside>
    </>
  );

  function SidebarContent({ onNavigate }: { onNavigate?: () => void } = {}) {
    return (
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TP</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">Tuckinn Proper</h1>
            <p className="text-xs text-muted-foreground">Operations Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <NavItems onNavigate={onNavigate} />
        </div>

        {/* User / Logout */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user?.firstName} {session?.user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              logout();
              onNavigate?.();
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    );
  }
}
