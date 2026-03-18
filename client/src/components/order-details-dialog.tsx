import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, Trash2, ArrowRight, User, MapPin, Phone, Mail, Scale, DollarSign, Tag, CalendarClock, Pencil, X } from "lucide-react";
import { useUpdateOrder, useDeleteOrder } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { type Order } from "@shared/schema";

const SERVICES: Record<string, number> = {
  "Wash & Hang": 30,
  "Dry-cleaning": 60,
};

const editSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  address: z.string().min(2, "Address is required"),
  contactNumber: z.string().min(5, "Contact number is required"),
  email: z.string().email("Invalid email"),
  service: z.string().min(1, "Please select a service"),
  weight: z.string().min(1, "Weight is required"),
  total: z.string().min(1, "Total is required"),
});

type EditValues = z.infer<typeof editSchema>;

interface OrderDetailsProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder();
  const { toast } = useToast();

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    values: order ? {
      customerName: order.customerName,
      address: order.address,
      contactNumber: order.contactNumber,
      email: order.email,
      service: order.service,
      weight: String(order.weight),
      total: String(order.total),
    } : undefined,
  });

  const watchedService = form.watch("service");
  const watchedWeight = form.watch("weight");

  useEffect(() => {
    if (!isEditing) return;
    const pricePerKg = SERVICES[watchedService] ?? 0;
    const kg = parseFloat(watchedWeight);
    if (pricePerKg > 0 && !isNaN(kg) && kg > 0) {
      form.setValue("total", (pricePerKg * kg).toFixed(2), { shouldValidate: true });
    }
  }, [watchedService, watchedWeight, isEditing, form]);

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

  const handleSaveEdit = (data: EditValues) => {
    updateOrder(
      { id: order.id, ...data },
      {
        onSuccess: () => {
          toast({ title: "Updated", description: "Order details have been saved." });
          setIsEditing(false);
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const getNextStatusAction = () => {
    switch (order.status) {
      case "pending": return { label: "Mark as Received", next: "received" };
      case "received": return { label: "Mark as Washed", next: "washed" };
      case "washed": return { label: "Ready for Pickup", next: "ready_for_pickup" };
      case "ready_for_pickup": return { label: "Complete Order", next: "completed" };
      default: return null;
    }
  };

  const action = getNextStatusAction();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'requested': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'received': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'washed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready_for_pickup': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setIsEditing(false); }}>
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

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveEdit)} className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="customerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl><Input className="rounded-xl bg-background/50 border-border/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contactNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl><Input className="rounded-xl bg-background/50 border-border/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" className="rounded-xl bg-background/50 border-border/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input className="rounded-xl bg-background/50 border-border/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="service" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Service</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl bg-background/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-border/50">
                        <SelectItem value="Wash & Hang">Wash &amp; Hang — ₱30/kg</SelectItem>
                        <SelectItem value="Dry-cleaning">Dry-cleaning — ₱60/kg</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (KG)</FormLabel>
                    <FormControl><Input type="number" step="0.1" className="rounded-xl bg-background/50 border-border/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="total" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount (₱) <span className="text-xs text-muted-foreground font-normal">Auto-computed</span></FormLabel>
                    <FormControl><Input type="number" step="0.01" readOnly className="rounded-xl bg-muted/40 border-border/50 cursor-not-allowed" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <Button type="button" variant="ghost" className="rounded-xl gap-2" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4" /> Cancel
                </Button>
                <Button type="submit" className="rounded-xl px-6" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <>
            <div className="grid gap-6 py-4">
              <div className="bg-background/50 rounded-2xl p-5 border border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Customer Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 mt-0.5 text-primary" />
                    <p className="text-sm font-medium text-foreground">{order.customerName}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 mt-0.5 text-primary" />
                    <p className="text-sm text-foreground">{order.contactNumber}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 mt-0.5 text-primary" />
                    <p className="text-sm text-foreground truncate max-w-[200px]" title={order.email}>{order.email}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                    <p className="text-sm text-foreground">{order.address}</p>
                  </div>
                </div>
              </div>

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
                    <span className="text-sm font-semibold text-foreground">₱{order.total}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarClock className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{format(new Date(order.createdAt), "MMM dd, yyyy h:mm a")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-2">
              <div className="flex gap-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              </div>

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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
