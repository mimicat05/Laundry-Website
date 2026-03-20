import { useState } from "react";
import { Clock, PackageCheck, InboxIcon, ShirtIcon, Droplets, Wind, Layers } from "lucide-react";
import { Link } from "wouter";
import { useOrders } from "@/hooks/use-orders";
import { CreateOrderDialog } from "@/components/create-order-dialog";
import { OrderDetailsDialog } from "@/components/order-details-dialog";
import { OrdersTable } from "@/components/orders-table";
import { type Order } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export function Dashboard() {
  const { data: orders, isLoading } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  const allOrders = orders || [];
  const counts = {
    requested:        allOrders.filter(o => o.status === 'requested').length,
    pending:          allOrders.filter(o => o.status === 'pending').length,
    received:         allOrders.filter(o => o.status === 'received').length,
    washing:          allOrders.filter(o => o.status === 'washing').length,
    drying:           allOrders.filter(o => o.status === 'drying').length,
    folding:          allOrders.filter(o => o.status === 'folding').length,
    ready_for_pickup: allOrders.filter(o => o.status === 'ready_for_pickup').length,
  };

  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statBoxes = [
    { href: "/requests", label: "New Requests",    count: counts.requested,        icon: InboxIcon,    bg: "bg-purple-500/10", text: "text-purple-600", hover: "hover:border-purple-300" },
    { href: "/pending",  label: "Accepted",         count: counts.pending,          icon: Clock,        bg: "bg-amber-500/10",  text: "text-amber-600",  hover: "hover:border-amber-300" },
    { href: "/received", label: "Received",         count: counts.received,         icon: ShirtIcon,    bg: "bg-cyan-500/10",   text: "text-cyan-600",   hover: "hover:border-cyan-300" },
    { href: "/washing",  label: "Washing",          count: counts.washing,          icon: Droplets,     bg: "bg-blue-500/10",   text: "text-blue-600",   hover: "hover:border-blue-300" },
    { href: "/drying",   label: "Drying",           count: counts.drying,           icon: Wind,         bg: "bg-sky-500/10",    text: "text-sky-600",    hover: "hover:border-sky-300" },
    { href: "/folding",  label: "Folding",          count: counts.folding,          icon: Layers,       bg: "bg-violet-500/10", text: "text-violet-600", hover: "hover:border-violet-300" },
    { href: "/pickup",   label: "Ready for Pickup", count: counts.ready_for_pickup, icon: PackageCheck, bg: "bg-indigo-500/10", text: "text-indigo-600", hover: "hover:border-indigo-300" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
        <CreateOrderDialog />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {statBoxes.map(({ href, label, count, icon: Icon, bg, text, hover }) => (
          <Link key={href} href={href}>
            <div className={`bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-3xl p-5 sleek-shadow relative overflow-hidden group cursor-pointer transition-colors ${hover}`}>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-20 h-20" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${bg} ${text}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className={`font-medium text-sm leading-tight ${text}`}>{label}</h3>
              </div>
              <p className="text-4xl font-display font-bold text-foreground">{count}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-display text-xl font-bold text-foreground">Recent Orders</h2>
        </div>
        <OrdersTable 
          orders={recentOrders} 
          onRowClick={setSelectedOrder} 
          emptyMessage="No orders have been created yet."
        />
      </div>

      <OrderDetailsDialog 
        order={selectedOrder} 
        open={!!selectedOrder} 
        onOpenChange={(open) => !open && setSelectedOrder(null)} 
      />
    </div>
  );
}
