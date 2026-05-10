import { useState, useCallback } from "react";
import { Search, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useOrders, useUpdateOrder } from "@/hooks/use-orders";
import { OrderDetailsDialog } from "@/components/order-details-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Order } from "@shared/schema";

const REJECTION_REASONS = [
  "Fully booked",
  "Outside service area",
  "Service unavailable",
  "Incorrect information",
  "Duplicate order",
  "Other",
];

function DeclineReasonDialog({
  open,
  onClose,
  onConfirm,
  isPending,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
  title?: string;
}) {
  const [selected, setSelected] = useState("");

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
    setSelected("");
  };

  const handleClose = () => {
    setSelected("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {title ?? "Decline Request"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">Select a reason for declining:</p>
        <div className="space-y-2 mt-1">
          {REJECTION_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelected(reason)}
              data-testid={`reason-${reason.toLowerCase().replace(/\s+/g, "-")}`}
              className={`w-full text-left text-sm px-4 py-2.5 rounded-xl border transition-colors ${
                selected === reason
                  ? "bg-red-50 border-red-300 text-red-700 font-medium"
                  : "border-border/60 hover:border-border text-foreground hover:bg-muted/40"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" className="rounded-xl" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl"
            disabled={!selected || isPending}
            onClick={handleConfirm}
            data-testid="button-confirm-decline"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestRow({
  order,
  onView,
  selected,
  onToggle,
}: {
  order: Order;
  onView: (o: Order) => void;
  selected: boolean;
  onToggle: (id: number) => void;
}) {
  const { mutate: updateOrder, isPending } = useUpdateOrder();
  const { toast } = useToast();
  const [declineOpen, setDeclineOpen] = useState(false);

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

  const handleDeclineConfirm = (reason: string) => {
    updateOrder(
      { id: order.id, status: "rejected", rejectionReason: reason },
      {
        onSuccess: () => {
          toast({ title: "Request Declined", description: `${order.orderId} has been declined.` });
          setDeclineOpen(false);
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  return (
    <>
      <TableRow
        className="hover:bg-muted/30 transition-colors cursor-pointer border-border/50"
        onClick={() => onView(order)}
        data-testid={`row-request-${order.id}`}
      >
        <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle(order.id)}
            data-testid={`checkbox-request-${order.id}`}
          />
        </TableCell>
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
              data-testid={`button-view-${order.id}`}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl gap-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={handleAccept}
              disabled={isPending}
              data-testid={`button-accept-${order.id}`}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={(e) => { e.stopPropagation(); setDeclineOpen(true); }}
              disabled={isPending}
              data-testid={`button-decline-${order.id}`}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Decline
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <DeclineReasonDialog
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        onConfirm={handleDeclineConfirm}
        isPending={isPending}
      />
    </>
  );
}

export function RequestsView() {
  const { data: orders, isLoading } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeclineOpen, setBulkDeclineOpen] = useState(false);
  const { mutate: updateOrder, isPending: isBulkPending } = useUpdateOrder();
  const { toast } = useToast();

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

  const allSelected = requests.length > 0 && requests.every((o) => selectedIds.has(o.id));
  const someSelected = requests.some((o) => selectedIds.has(o.id));
  const visibleSelectedIds = requests.filter((o) => selectedIds.has(o.id)).map((o) => o.id);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        requests.forEach((o) => next.delete(o.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        requests.forEach((o) => next.add(o.id));
        return next;
      });
    }
  }, [allSelected, requests]);

  const handleToggle = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkAccept = () => {
    let completed = 0;
    const total = visibleSelectedIds.length;
    visibleSelectedIds.forEach((id) => {
      updateOrder(
        { id, status: "pending" },
        {
          onSuccess: () => {
            completed++;
            if (completed === total) {
              toast({ title: "Orders Accepted", description: `${total} order${total > 1 ? "s" : ""} have been accepted.` });
              setSelectedIds(new Set());
            }
          },
          onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
        }
      );
    });
  };

  const handleBulkDeclineConfirm = (reason: string) => {
    const total = visibleSelectedIds.length;
    let completed = 0;
    visibleSelectedIds.forEach((id) => {
      updateOrder(
        { id, status: "rejected", rejectionReason: reason },
        {
          onSuccess: () => {
            completed++;
            if (completed === total) {
              toast({ title: "Requests Declined", description: `${total} request${total > 1 ? "s" : ""} have been declined.` });
              setSelectedIds(new Set());
              setBulkDeclineOpen(false);
            }
          },
          onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
        }
      );
    });
  };

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
            data-testid="input-search-requests"
          />
        </div>
      </div>

      {visibleSelectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-2xl">
          <span className="text-sm font-medium text-foreground">
            {visibleSelectedIds.length} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl gap-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={handleBulkAccept}
              disabled={isBulkPending}
              data-testid="button-bulk-accept"
            >
              <CheckCircle className="w-4 h-4" />
              Accept All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => setBulkDeclineOpen(true)}
              disabled={isBulkPending}
              data-testid="button-bulk-decline"
            >
              <XCircle className="w-4 h-4" />
              Decline All
            </Button>
          </div>
        </div>
      )}

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
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                      aria-label="Select all requests"
                    />
                  </TableHead>
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
                  <RequestRow
                    key={order.id}
                    order={order}
                    onView={setSelectedOrder}
                    selected={selectedIds.has(order.id)}
                    onToggle={handleToggle}
                  />
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

      <DeclineReasonDialog
        open={bulkDeclineOpen}
        onClose={() => setBulkDeclineOpen(false)}
        onConfirm={handleBulkDeclineConfirm}
        isPending={isBulkPending}
        title={`Decline ${visibleSelectedIds.length} Request${visibleSelectedIds.length > 1 ? "s" : ""}`}
      />
    </div>
  );
}
