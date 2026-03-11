import { format } from "date-fns";
import { Eye } from "lucide-react";
import { type Order } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  Body,
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
}

export function OrdersTable({ orders, onRowClick, emptyMessage = "No orders found." }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-border/60 rounded-2xl bg-background/50">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'washed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready_for_pickup': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 sleek-shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="font-semibold text-foreground">Order ID</TableHead>
              <TableHead className="font-semibold text-foreground">Customer</TableHead>
              <TableHead className="font-semibold text-foreground">Service</TableHead>
              <TableHead className="font-semibold text-foreground">Date</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow 
                key={order.id} 
                className="hover:bg-muted/30 transition-colors cursor-pointer border-border/50"
                onClick={() => onRowClick(order)}
              >
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
                  <Badge variant="outline" className={`capitalize rounded-full font-medium border ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
