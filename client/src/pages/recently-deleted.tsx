import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { type Order } from "@shared/schema";
import { format } from "date-fns";

export function RecentlyDeleted() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders/deleted"],
    queryFn: async () => {
      const res = await fetch(api.orders.listDeleted.path);
      return res.json();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest({
        method: "POST",
        url: `/api/orders/${id}/restore`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const deletedOrders: Order[] = orders || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Recently Deleted</h1>
        <p className="text-muted-foreground mt-1">Orders that have been deleted. You can restore them if needed.</p>
      </div>

      {deletedOrders.length === 0 ? (
        <Card className="border border-border/50 rounded-3xl p-8 text-center">
          <Trash2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-lg">No deleted orders</p>
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

                <Button
                  onClick={() => restoreMutation.mutate(order.id)}
                  disabled={restoreMutation.isPending}
                  className="gap-2 rounded-xl"
                >
                  <RotateCcw className="w-4 h-4" />
                  {restoreMutation.isPending ? "Restoring..." : "Restore"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
