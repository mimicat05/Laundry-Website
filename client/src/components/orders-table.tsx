import { format } from "date-fns";
import { Eye } from "lucide-react";
import { type Order } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { statusLabel } from "@/lib/order-utils";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody
} from "@/components/ui/table";

interface OrdersTableProps {
  orders: Order[];
  onRowClick: (order: Order) => void;
  emptyMessage?: string;
  selectable?: boolean;
  selectedIds?: Set<number>;
  onSelectionChange?: (ids: Set<number>) => void;
}

export function OrdersTable({
  orders,
  onRowClick,
  emptyMessage = "No orders found.",
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
}: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-border/60 rounded-2xl bg-background/50">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const allSelected = orders.length > 0 && orders.every((o) => selectedIds.has(o.id));
  const someSelected = orders.some((o) => selectedIds.has(o.id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      const next = new Set(selectedIds);
      orders.forEach((o) => next.delete(o.id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      orders.forEach((o) => next.add(o.id));
      onSelectionChange(next);
    }
  };

  const toggleOne = (id: number) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'requested':        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending':          return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'received':         return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'washing':          return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'drying':           return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'folding':          return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'ready_for_pickup': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed':        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':        return 'bg-red-100 text-red-800 border-red-200';
      default:                 return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 sleek-shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border/50">
              {selectable && (
                <TableHead className="w-10 pl-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              <TableHead className="font-semibold text-foreground">Order ID</TableHead>
              <TableHead className="font-semibold text-foreground">Customer</TableHead>
              <TableHead className="font-semibold text-foreground">Service</TableHead>
              <TableHead className="font-semibold text-foreground">Date</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const isSelected = selectedIds.has(order.id);
              return (
                <TableRow
                  key={order.id}
                  className={`hover:bg-muted/30 transition-colors cursor-pointer border-border/50 ${isSelected ? "bg-primary/5" : ""}`}
                  onClick={() => onRowClick(order)}
                >
                  {selectable && (
                    <TableCell className="pl-4" onClick={(e) => { e.stopPropagation(); toggleOne(order.id); }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(order.id)}
                        className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                        aria-label={`Select ${order.orderId}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium text-foreground">{order.orderId}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{order.customerName}</span>
                      <span className="text-xs text-muted-foreground">{order.contactNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{order.service}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(order.createdAt), "MMM dd")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={`rounded-full font-medium border ${getStatusColor(order.status)}`}>
                        {statusLabel(order.status)}
                      </Badge>
                      {order.status !== "cancelled" && !order.paid && (
                        <Badge variant="outline" className="rounded-full font-medium border bg-red-50 text-red-600 border-red-200">
                          Unpaid
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
