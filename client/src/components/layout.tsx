import { Link, useLocation } from "wouter";
import { LayoutDashboard, Clock, PackageCheck, Archive, LogOut, Menu, Droplets, Trash2, InboxIcon, ShirtIcon, Wind, Layers } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navGroups = [
  {
    group: "Input",
    color: "bg-blue-500",
    border: "border-blue-200",
    items: [
      { href: "/requests", label: "New Requests", icon: InboxIcon, showBadge: true },
      { href: "/pending",  label: "Accepted",     icon: Clock },
      { href: "/received", label: "Received",     icon: ShirtIcon },
    ],
  },
  {
    group: "Processing",
    color: "bg-amber-500",
    border: "border-amber-200",
    items: [
      { href: "/washing", label: "Washing", icon: Droplets },
      { href: "/drying",  label: "Drying",  icon: Wind },
      { href: "/folding", label: "Folding", icon: Layers },
    ],
  },
  {
    group: "Output",
    color: "bg-emerald-500",
    border: "border-emerald-200",
    items: [
      { href: "/pickup",  label: "Ready for Pickup", icon: PackageCheck },
      { href: "/history", label: "Completed",        icon: Archive },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: orders } = useOrders();
  const requestCount = (orders || []).filter((o) => o.status === "requested").length;

  const NavLinks = () => (
    <div className="flex flex-col gap-1">
      {/* Dashboard */}
      <Link
        href="/dashboard"
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 mb-2 ${
          location === "/dashboard"
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
      >
        <LayoutDashboard className="w-5 h-5 shrink-0" />
        <span className="font-medium">Dashboard</span>
      </Link>

      <div className="h-px bg-border/50 mb-2" />

      {/* Grouped sections */}
      {navGroups.map((section) => (
        <div key={section.group} className="mb-3">
          {/* Section header */}
          <div className="flex items-center gap-2 px-3 mb-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${section.color}`} />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.group}
            </span>
          </div>

          {/* Items with left border accent */}
          <div className={`ml-3 pl-3 border-l-2 ${section.border} space-y-0.5`}>
            {section.items.map((item) => {
              const isActive = location === item.href;
              const count = item.showBadge ? requestCount : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="font-medium text-sm flex-1">{item.label}</span>
                  {count > 0 && (
                    <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-full">
                      {count}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Recently Deleted — separated at bottom */}
      <div className="h-px bg-border/50 mt-1 mb-2" />
      <Link
        href="/deleted"
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
          location === "/deleted"
            ? "bg-destructive/10 text-destructive"
            : "text-muted-foreground hover:bg-destructive/5 hover:text-destructive/80"
        }`}
      >
        <Trash2 className="w-4 h-4 shrink-0" />
        <span className="font-medium text-sm">Recently Deleted</span>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl px-4 py-6 sleek-shadow z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-6 text-primary">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold text-foreground leading-tight">Lavanderia</h1>
            <p className="text-xs text-muted-foreground leading-tight">Sunrise</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <NavLinks />
        </nav>

        <div className="pt-4 border-t border-border/50 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2 text-primary">
            <Droplets className="w-6 h-6" />
            <span className="font-display font-bold text-xl text-foreground">Lavanderia Sunrise</span>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-background border-r-0 px-4 py-6 flex flex-col">
              <div className="flex items-center gap-2.5 px-2 mb-6 mt-2 text-primary">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-display text-base font-bold text-foreground leading-tight">Lavanderia</h1>
                  <p className="text-xs text-muted-foreground leading-tight">Sunrise</p>
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto">
                <NavLinks />
              </nav>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl mt-4"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium text-sm">Sign Out</span>
              </Button>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
