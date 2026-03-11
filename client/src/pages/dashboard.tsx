import { useState } from "react";
import { Link } from "wouter";
import { Package, Clock, PackageCheck, ArrowRight } from "lucide-react";
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  const allOrders = orders || [];
  const pendingCount = allOrders.filter(o => o.status === 'pending').length;
  const pickupCount = allOrders.filter(o => o.status === 'ready_for_pickup').length;
  const recentOrders = allOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening today.</p>
        </div>
        <CreateOrderDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-3xl p-6 sleek-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Package className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-medium text-muted-foreground">Total Orders</h3>
          </div>
          <p className="text-4xl font-display font-bold text-foreground">{allOrders.length}</p>
        </div>

        <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-3xl p-6 sleek-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-medium text-muted-foreground">Pending Wash</h3>
          </div>
          <p className="text-4xl font-display font-bold text-foreground">{pendingCount}</p>
        </div>

        <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-3xl p-6 sleek-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <PackageCheck className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <PackageCheck className="w-6 h-6" />
            </div>
            <h3 className="font-medium text-muted-foreground">Ready for Pickup</h3>
          </div>
          <p className="text-4xl font-display font-bold text-foreground">{pickupCount}</p>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-display text-xl font-bold text-foreground">Recent Orders</h2>
          <Link href="/history" className="text-sm font-medium text-primary hover:underline flex items-center">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
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
