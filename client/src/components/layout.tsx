import { Link, useLocation } from "wouter";
import { LayoutDashboard, Clock, PackageCheck, Archive, LogOut, Menu, Droplets, Trash2, InboxIcon, ShirtIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "Requests", icon: InboxIcon, showBadge: true },
  { href: "/pending", label: "Accepted Orders", icon: Clock },
  { href: "/received", label: "Received", icon: ShirtIcon },
  { href: "/washed", label: "Washed", icon: Droplets },
  { href: "/pickup", label: "Pickup", icon: PackageCheck },
  { href: "/history", label: "History", icon: Archive },
  { href: "/deleted", label: "Recently Deleted", icon: Trash2 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: orders } = useOrders();
  const requestCount = (orders || []).filter((o) => o.status === "requested").length;

  const NavLinks = () => (
    <div className="space-y-2">
      {navItems.map((item) => {
        const isActive = location === item.href;
        const count = item.showBadge ? requestCount : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium flex-1">{item.label}</span>
            {count > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-full">
                {count}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-border/50 bg-card/50 backdrop-blur-xl p-6 sleek-shadow z-10">
        <div className="flex items-center gap-3 px-2 mb-10 text-primary">
          <Droplets className="w-8 h-8" />
          <h1 className="font-display text-2xl font-bold text-foreground">Lavanderia Sunrise</h1>
        </div>
        
        <nav className="flex-1">
          <h2 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Menu</h2>
          <NavLinks />
        </nav>

        <div className="pt-6 border-t border-border/50 mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl py-6"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
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
            <SheetContent side="left" className="w-72 bg-background border-r-0 p-6 flex flex-col">
              <div className="flex items-center gap-3 px-2 mb-10 mt-4 text-primary">
                <Droplets className="w-8 h-8" />
                <h1 className="font-display text-2xl font-bold text-foreground">Lavanderia Sunrise</h1>
              </div>
              <nav className="flex-1">
                <NavLinks />
              </nav>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={logout}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
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
