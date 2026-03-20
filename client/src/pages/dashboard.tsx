import { useState } from "react";
import { Clock, PackageCheck, InboxIcon, ShirtIcon, Droplets } from "lucide-react";
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  const allOrders = orders || [];
  const requestCount = allOrders.filter(o => o.status === 'requested').length;
  const acceptedCount = allOrders.filter(o => o.status === 'pending').length;
  const receivedCount = allOrders.filter(o => o.status === 'received').length;
  const inProgressCount = allOrders.filter(o => o.status === 'washed').length;
  const pickupCount = allOrders.filter(o => o.status === 'ready_for_pickup').length;
  const recentOrders = allOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statBoxes = [
    { href: "/requests",  label: "New Requests",     count: requestCount,    icon: InboxIcon,    color: "purple" },
    { href: "/pending",   label: "Accepted",          count: acceptedCount,   icon: Clock,        color: "blue" },
    { href: "/received",  label: "Received Items",    count: receivedCount,   icon: ShirtIcon,    color: "amber" },
    { href: "/washed",    label: "In Progress",       count: inProgressCount, icon: Droplets,     color: "cyan" },
    { href: "/pickup",    label: "Ready for Pickup",  count: pickupCount,     icon: PackageCheck, color: "indigo" },
  ];

  const colorMap: Record<string, string> = {
    purple: "bg-purple-500/10 text-purple-600 hover:border-purple-300",
    blue:   "bg-blue-500/10 text-blue-600 hover:border-blue-300",
    amber:  "bg-amber-500/10 text-amber-600 hover:border-amber-300",
    cyan:   "bg-cyan-500/10 text-cyan-600 hover:border-cyan-300",
    indigo: "bg-indigo-500/10 text-indigo-600 hover:border-indigo-300",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
        <CreateOrderDialog />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
        {statBoxes.map(({ href, label, count, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <div className={`bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-3xl p-6 sleek-shadow relative overflow-hidden group cursor-pointer transition-colors ${colorMap[color].split(" ").slice(2).join(" ")}`}>
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorMap[color].split(" ").slice(0, 2).join(" ")}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-muted-foreground text-sm leading-tight">{label}</h3>
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
