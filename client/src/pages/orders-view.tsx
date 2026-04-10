import { useState } from "react";
import { Search, ArrowRight, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { useOrders } from "@/hooks/use-orders";
import { useQueryClient } from "@tanstack/react-query";
import { OrderDetailsDialog } from "@/components/order-details-dialog";
import { OrdersTable } from "@/components/orders-table";
import { statusLabel } from "@/lib/order-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type Order } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { api, buildUrl } from "@shared/routes";

interface OrdersViewProps {
  status: string;
  title: string;
  description: string;
}

const NEXT_STATUS: Record<string, string> = {
  pending:          "received",
  received:         "washing",
  washing:          "drying",
  drying:           "folding",
  folding:          "ready_for_pickup",
  ready_for_pickup: "completed",
};

export function OrdersView({ status, title }: OrdersViewProps) {
  const { data: orders, isLoading } = useOrders();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const nextStatus = NEXT_STATUS[status];
  const selectable = !!nextStatus;

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
    .filter(o => {
      if (!query) return true;
      const dateStr = format(new Date(o.createdAt), "MMM dd yyyy").toLowerCase();
      return (
        o.customerName.toLowerCase().includes(query) ||
        o.orderId.toLowerCase().includes(query) ||
        o.email.toLowerCase().includes(query) ||
        o.service.toLowerCase().includes(query) ||
        dateStr.includes(query)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const selectedCount = selectedIds.size;

  const handleBulkUpdate = async () => {
    if (!nextStatus || selectedCount === 0) return;
    setIsBulkUpdating(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(buildUrl(api.orders.update.path, { id }), {
            method: api.orders.update.method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
            credentials: "include",
          })
        )
      );
      await queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      toast({
        title: "Status Updated",
        description: `${selectedCount} order${selectedCount > 1 ? "s" : ""} moved to ${statusLabel(nextStatus)}.`,
      });
      setSelectedIds(new Set());
    } catch {
      toast({ title: "Error", description: "Some orders could not be updated.", variant: "destructive" });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
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
        selectable={selectable}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <OrderDetailsDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />

      {/* Bulk action bar */}
      {selectable && selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 bg-card border border-border/60 rounded-2xl shadow-2xl px-5 py-3">
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">
              {selectedCount} order{selectedCount > 1 ? "s" : ""} selected
            </span>
            <div className="w-px h-5 bg-border/60" />
            <Button
              size="sm"
              className="rounded-xl gap-2 shadow-lg shadow-primary/20"
              onClick={handleBulkUpdate}
              disabled={isBulkUpdating}
            >
              {isBulkUpdating
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ArrowRight className="w-4 h-4" />}
              Move to {statusLabel(nextStatus)}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedIds(new Set())}
              disabled={isBulkUpdating}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
