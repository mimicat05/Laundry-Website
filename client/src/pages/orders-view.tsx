import { useState } from "react";
import { useOrders } from "@/hooks/use-orders";
import { OrderDetailsDialog } from "@/components/order-details-dialog";
import { OrdersTable } from "@/components/orders-table";
import { type Order } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface OrdersViewProps {
  status: string;
  title: string;
  description: string;
}

export function OrdersView({ status, title, description }: OrdersViewProps) {
  const { data: orders, isLoading } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <Skeleton className="h-10 w-48 rounded-xl mb-2" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-[500px] rounded-3xl" />
      </div>
    );
  }

  // Filter orders by status (unless status is 'all' for history, but history is completed typically)
  const filteredOrders = (orders || [])
    .filter(o => status === 'all' ? true : o.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
      </div>

      <OrdersTable 
        orders={filteredOrders} 
        onRowClick={setSelectedOrder} 
        emptyMessage={`No ${status === 'all' ? '' : status.replace('_', ' ')} orders found.`}
      />

      <OrderDetailsDialog 
        order={selectedOrder} 
        open={!!selectedOrder} 
        onOpenChange={(open) => !open && setSelectedOrder(null)} 
      />
    </div>
  );
}
