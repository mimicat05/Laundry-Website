import { useState } from "react";
import { Search } from "lucide-react";
import { useOrders } from "@/hooks/use-orders";
import { OrderDetailsDialog } from "@/components/order-details-dialog";
import { OrdersTable } from "@/components/orders-table";
import { Input } from "@/components/ui/input";
import { type Order } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface OrdersViewProps {
  status: string;
  title: string;
  description: string;
}

export function OrdersView({ status, title }: OrdersViewProps) {
  const { data: orders, isLoading } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>
        <Skeleton className="h-[500px] rounded-3xl" />
      </div>
    );
  }

  const query = search.toLowerCase();
  const filteredOrders = (orders || [])
    .filter(o => status === 'all' ? true : o.status === status)
    .filter(o =>
      !query ||
      o.customerName.toLowerCase().includes(query) ||
      o.orderId.toLowerCase().includes(query) ||
      o.email.toLowerCase().includes(query) ||
      o.service.toLowerCase().includes(query)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl bg-background border-border/50"
            data-testid="input-search"
          />
        </div>
      </div>

      <OrdersTable
        orders={filteredOrders}
        onRowClick={setSelectedOrder}
        emptyMessage={search ? `No results for "${search}".` : `No ${status === 'all' ? '' : status.replace('_', ' ')} orders found.`}
      />

      <OrderDetailsDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />
    </div>
  );
}
