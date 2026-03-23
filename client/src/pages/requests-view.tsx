import { useState } from "react";
import { Search, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useOrders, useUpdateOrder, useDeleteOrder } from "@/hooks/use-orders";
import { OrderDetailsDialog } from "@/components/order-details-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Order } from "@shared/schema";

function RequestRow({ order, onView }: { order: Order; onView: (o: Order) => void }) {
  const { mutate: updateOrder, isPending: isAccepting } = useUpdateOrder();
  const { mutate: deleteOrder, isPending: isDeclining } = useDeleteOrder();
  const { toast } = useToast();

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateOrder(
      { id: order.id, status: "pending" },
      {
        onSuccess: () => toast({ title: "Order Accepted", description: `${order.orderId} has been accepted. Customer has been notified.` }),
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Decline and remove order ${order.orderId}?`)) return;
    deleteOrder(order.id, {
      onSuccess: () => toast({ title: "Order Declined", description: `${order.orderId} has been removed.` }),
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <TableRow
      className="hover:bg-muted/30 transition-colors cursor-pointer border-border/50"
      onClick={() => onView(order)}
    >
      <TableCell className="font-medium text-foreground">{order.orderId}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{order.customerName}</span>
          <span className="text-xs text-muted-foreground">{order.contactNumber}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{order.service}</TableCell>
      <TableCell className="text-muted-foreground text-sm">{order.email}</TableCell>
      <TableCell className="text-muted-foreground">
        {format(new Date(order.createdAt), "MMM dd, h:mm a")}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={() => onView(order)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl gap-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={handleAccept}
            disabled={isAccepting || isDeclining}
          >
            {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Accept
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleDecline}
            disabled={isAccepting || isDeclining}
          >
            {isDeclining ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Decline
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function RequestsView() {
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
  const requests = (orders || [])
    .filter((o) => o.status === "requested")
    .filter((o) => {
      if (!query) return true;
      return (
        o.customerName.toLowerCase().includes(query) ||
        o.orderId.toLowerCase().includes(query) ||
        o.email.toLowerCase().includes(query) ||
        o.service.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">New Requests</h1>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl bg-background border-border/50"
          />
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border/60 rounded-2xl bg-background/50">
          <p className="text-muted-foreground">
            {search ? `No results for "${search}".` : "No pending requests. New customer orders will appear here."}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="font-semibold text-foreground">Order ID</TableHead>
                  <TableHead className="font-semibold text-foreground">Customer</TableHead>
                  <TableHead className="font-semibold text-foreground">Service</TableHead>
                  <TableHead className="font-semibold text-foreground">Email</TableHead>
                  <TableHead className="font-semibold text-foreground">Submitted</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((order) => (
                  <RequestRow key={order.id} order={order} onView={setSelectedOrder} />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <OrderDetailsDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />
    </div>
  );
}
