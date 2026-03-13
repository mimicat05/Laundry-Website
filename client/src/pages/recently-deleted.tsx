import { useState } from "react";
import { Trash2, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeletedOrders, useRestoreOrder, usePermanentDeleteOrder } from "@/hooks/use-orders";
import { type Order } from "@shared/schema";
import { format } from "date-fns";

export function RecentlyDeleted() {
  const { data: orders, isLoading } = useDeletedOrders();
  const { mutate: restoreOrder, isPending: isRestoring } = useRestoreOrder();
  const { mutate: permanentDelete, isPending: isDeleting } = usePermanentDeleteOrder();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const query = search.toLowerCase();
  const deletedOrders: Order[] = (orders || []).filter(o =>
    !query ||
    o.customerName.toLowerCase().includes(query) ||
    o.orderId.toLowerCase().includes(query) ||
    o.email.toLowerCase().includes(query)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-foreground">Recently Deleted</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl bg-background border-border/50"
            data-testid="input-search-deleted"
          />
        </div>
      </div>

      {deletedOrders.length === 0 ? (
        <Card className="border border-border/50 rounded-3xl p-8 text-center">
          <Trash2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-lg">
            {search ? `No results for "${search}".` : "No deleted orders"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {deletedOrders.map((order) => (
            <Card
              key={order.id}
              className="border border-border/50 rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground truncate">{order.customerName}</h3>
                    <span className="text-xs font-medium px-2 py-1 rounded-lg bg-muted text-muted-foreground">
                      {order.orderId}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Deleted: {order.deletedAt ? format(new Date(order.deletedAt), "MMM dd, yyyy") : "Unknown"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => restoreOrder(order.id)}
                    disabled={isRestoring || isDeleting}
                    className="gap-2 rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {isRestoring ? "Restoring..." : "Restore"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => permanentDelete(order.id)}
                    disabled={isDeleting || isRestoring}
                    className="gap-2 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
