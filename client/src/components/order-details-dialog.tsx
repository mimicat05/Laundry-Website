import { format } from "date-fns";
import { Loader2, Trash2, ArrowRight, User, MapPin, Phone, Mail, Scale, DollarSign, Tag, CalendarClock } from "lucide-react";
import { useUpdateOrder, useDeleteOrder } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { type Order } from "@shared/schema";

interface OrderDetailsProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsProps) {
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder();
  const { toast } = useToast();

  if (!order) return null;

  const handleStatusChange = (newStatus: string) => {
    updateOrder(
      { id: order.id, status: newStatus },
      {
        onSuccess: () => {
          toast({ title: "Status Updated", description: `Order moved to ${newStatus.replace('_', ' ')}.` });
          onOpenChange(false);
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this order?")) {
      deleteOrder(order.id, {
        onSuccess: () => {
          toast({ title: "Deleted", description: "Order has been removed." });
          onOpenChange(false);
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    }
  };

  const getNextStatusAction = () => {
    switch (order.status) {
      case "pending":
        return { label: "Mark as Washed", next: "washed" };
      case "washed":
        return { label: "Ready for Pickup", next: "ready_for_pickup" };
      case "ready_for_pickup":
        return { label: "Complete Order", next: "completed" };
      default:
        return null;
    }
  };

  const action = getNextStatusAction();

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl border-border/50 sleek-shadow bg-card/95 backdrop-blur-xl">
        <DialogHeader className="mb-2">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="font-display text-2xl flex items-center gap-3">
              {order.orderId}
              <Badge variant="outline" className={`capitalize rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                {order.status.replace('_', ' ')}
              </Badge>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Customer Info Card */}
          <div className="bg-background/50 rounded-2xl p-5 border border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Customer Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 mt-0.5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-primary" />
                <div>
                  <p className="text-sm text-foreground">{order.contactNumber}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <div>
                  <p className="text-sm text-foreground truncate max-w-[200px]" title={order.email}>{order.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                <div>
                  <p className="text-sm text-foreground">{order.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Details Card */}
          <div className="bg-background/50 rounded-2xl p-5 border border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Service Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{order.service}</span>
              </div>
              <div className="flex items-center gap-3">
                <Scale className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{order.weight} kg</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">${order.total}</span>
              </div>
              <div className="flex items-center gap-3">
                <CalendarClock className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{format(new Date(order.createdAt), "MMM dd, yyyy h:mm a")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-2">
          <Button 
            variant="destructive" 
            size="sm" 
            className="rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Close</Button>
            {action && (
              <Button 
                className="rounded-xl shadow-lg shadow-primary/20"
                onClick={() => handleStatusChange(action.next)}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {action.label}
                {!isUpdating && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
