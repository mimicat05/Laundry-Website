import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, Trash2, ArrowRight, User, MapPin, Phone, Mail, Scale, DollarSign, Tag, CalendarClock, Pencil, X, Printer, Sticker, CheckCircle2, XCircle, Percent, BadgePercent, ClipboardCheck, ReceiptText } from "lucide-react";
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
import { type Order, type Service, type Promo } from "@shared/schema";
import { printSticker, printReceipt } from "@/lib/print-receipt";
import { statusLabel } from "@/lib/order-utils";

const editSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  address: z.string().min(2, "Address is required"),
  contactNumber: z.string().min(5, "Contact number is required"),
  email: z.string().email("Invalid email"),
  service: z.string().min(1, "Please select a service"),
  weight: z
  .string()
  .refine((val) => parseFloat(val) > 0, {
    message: "Weight must be greater than 0",
  }),
  total: z.string().min(1, "Total is required"),
  notes: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

interface OrderDetailsProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [selectedPromoId, setSelectedPromoId] = useState<string>("");
  const [actualWeightInput, setActualWeightInput] = useState("");
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder();
  const { toast } = useToast();

  const { data: serviceList } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: promoList } = useQuery<Promo[]>({ queryKey: ["/api/promos"] });
  const activeServices = useMemo(() => (serviceList || []).filter((s) => s.active), [serviceList]);
  const activePromos = useMemo(() => (promoList || []).filter((p) => p.active), [promoList]);

  useEffect(() => {
    if (!open) {
      setSelectedPromoId("");
      setActualWeightInput("");
    }
    if (open && order) {
      setActualWeightInput(order.actualWeight ? String(order.actualWeight) : "");
    }
  }, [open, order?.id]);

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
      notes: order.notes ?? "",
    } : undefined,
  });

  const watchedService = form.watch("service");
  const watchedWeight = form.watch("weight");

  useEffect(() => {
    if (!isEditing) return;
    const svc = activeServices.find((s) => s.name === watchedService);
    const pricePerKg = svc ? Number(svc.pricePerKg) : 0;
    const kg = parseFloat(watchedWeight);
    if (pricePerKg > 0 && !isNaN(kg) && kg > 0) {
      form.setValue("total", (pricePerKg * kg).toFixed(2), { shouldValidate: true });
    }
  }, [watchedService, watchedWeight, isEditing, form, activeServices]);

  if (!order) return null;

  const baseTotal = order.discountAmount
    ? parseFloat(String(order.total)) + parseFloat(String(order.discountAmount))
    : parseFloat(String(order.total));

  const selectedPromo = activePromos.find((p) => String(p.id) === selectedPromoId);
  const previewDiscount = selectedPromo ? (baseTotal * parseFloat(String(selectedPromo.discount))) / 100 : 0;
  const previewTotal = baseTotal - previewDiscount;

  const handleApplyPromo = () => {
    if (!selectedPromo) return;
    const discountAmt = previewDiscount.toFixed(2);
    const newTotal = previewTotal.toFixed(2);
    updateOrder(
      { id: order.id, total: newTotal, promoId: selectedPromo.id, promoName: selectedPromo.name, discountAmount: discountAmt },
      {
        onSuccess: () => {
          toast({ title: "Discount Applied", description: `${selectedPromo.name} (${selectedPromo.discount}% off) has been applied.` });
          setSelectedPromoId("");
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleRemovePromo = () => {
    updateOrder(
      { id: order.id, total: baseTotal.toFixed(2), promoId: null, promoName: null, discountAmount: null },
      {
        onSuccess: () => {
          toast({ title: "Discount Removed", description: "The promo discount has been removed." });
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleStatusChange = (newStatus: string) => {
    updateOrder(
      { id: order.id, status: newStatus },
      {
        onSuccess: () => {
          toast({ title: "Status Updated", description: `Order moved to ${statusLabel(newStatus)}.` });
          onOpenChange(false);
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleTogglePaid = () => {
    updateOrder(
      { id: order.id, paid: !order.paid },
      {
        onSuccess: () => {
          toast({ title: order.paid ? "Marked as Unpaid" : "Marked as Paid" });
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
      case "pending":          return { label: "Mark as Received",         next: "received" };
      case "received":         return { label: "Mark as Washing",          next: "washing" };
      case "washing":          return { label: "Mark as Drying",           next: "drying" };
      case "drying":           return { label: "Mark as Folding",          next: "folding" };
      case "folding":          return { label: "Mark as Ready for Pickup", next: "ready_for_pickup" };
      case "ready_for_pickup": return { label: "Complete Order",           next: "completed" };
      default: return null;
    }
  };

  const action = getNextStatusAction();

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
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setIsEditing(false); setShowPrintMenu(false); } }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto rounded-3xl border-border/50 sleek-shadow bg-card/95 backdrop-blur-xl p-6">
        <DialogHeader className="mb-2">
          <div className="flex items-center justify-between pr-8 flex-wrap gap-2">
            <DialogTitle className="font-display text-2xl flex items-center gap-3 flex-wrap">
              {order.orderId}
              <Badge variant="outline" className={`capitalize rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                {statusLabel(order.status)}
              </Badge>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${order.paid ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                {order.paid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {order.paid ? "Paid" : "Unpaid"}
              </span>
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
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Special Instructions <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                    <FormControl>
                      <textarea rows={2} placeholder="e.g. No fabric softener, separate whites..." className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="service" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Service</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-border/50">
                        {activeServices.map((svc) => (
                          <SelectItem key={svc.id} value={svc.name}>{svc.name} (₱{Number(svc.pricePerKg).toFixed(0)}/kg)</SelectItem>
                        ))}
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
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">
                        {order.actualWeight ? (
                          <><span className="font-semibold">{Number(order.actualWeight).toFixed(2)} kg</span> <span className="text-xs text-muted-foreground">(actual)</span></>
                        ) : (
                          <>{order.weight} kg <span className="text-xs text-muted-foreground">(estimated)</span></>
                        )}
                      </span>
                      {order.actualWeight && String(order.actualWeight) !== String(order.weight) && (
                        <span className="text-xs text-muted-foreground">Est: {order.weight} kg</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <div className="flex flex-col">
                      {order.discountAmount && (
                        <span className="text-xs text-muted-foreground line-through">₱{baseTotal.toFixed(2)}</span>
                      )}
                      <span className="text-sm font-semibold text-foreground">₱{order.total}</span>
                      {order.discountAmount && (
                        <span className="text-xs text-emerald-600 font-medium">-₱{parseFloat(String(order.discountAmount)).toFixed(2)} discount</span>
                      )}
                    </div>
                    <button
                      data-testid="button-toggle-paid"
                      onClick={handleTogglePaid}
                      disabled={isUpdating}
                      className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full border transition-colors cursor-pointer ${order.paid ? "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300" : "bg-red-50 text-red-600 border-red-200 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300"}`}
                    >
                      {isUpdating ? "..." : order.paid ? "Paid" : "Not Paid"}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarClock className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{format(new Date(order.createdAt), "MMM dd, yyyy h:mm a")}</span>
                  </div>
                </div>
              </div>

              {/* Actual Weight Recording — visible once order is received at the shop */}
              {["received", "washing", "drying", "folding", "ready_for_pickup", "completed"].includes(order.status) && (
                <div className="bg-background/50 rounded-2xl p-5 border border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actual Weight</h4>
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-muted-foreground">Weighed at shop (kg)</label>
                      <input
                        data-testid="input-actual-weight"
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="e.g. 3.5"
                        value={actualWeightInput}
                        onChange={(e) => setActualWeightInput(e.target.value)}
                        disabled={order.status === "completed"}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    {order.status !== "completed" && (
                      <Button
                        data-testid="button-save-actual-weight"
                        size="sm"
                        className="rounded-xl"
                        disabled={isUpdating || !actualWeightInput || parseFloat(actualWeightInput) <= 0}
                        onClick={() => {
                          const svc = (serviceList || []).find((s) => s.name === order.service);
                          const pricePerKg = svc ? Number(svc.pricePerKg) : 0;
                          const kg = parseFloat(actualWeightInput);
                          const baseTotal = pricePerKg > 0 && kg > 0 ? pricePerKg * kg : Number(order.total);
                          const discountAmt = order.discountAmount ? Number(order.discountAmount) : 0;
                          const promoRatio = order.discountAmount && Number(order.total) > 0
                            ? discountAmt / (Number(order.total) + discountAmt)
                            : 0;
                          const newDiscount = promoRatio > 0 ? (baseTotal * promoRatio).toFixed(2) : order.discountAmount;
                          const newTotal = promoRatio > 0 ? (baseTotal - Number(newDiscount)).toFixed(2) : baseTotal.toFixed(2);
                          updateOrder(
                            { id: order.id, actualWeight: actualWeightInput, weight: actualWeightInput, total: newTotal, ...(promoRatio > 0 ? { discountAmount: newDiscount } : {}) },
                            {
                              onSuccess: () => toast({ title: "Weight Recorded", description: `Actual weight set to ${kg.toFixed(2)} kg. Total updated to ₱${newTotal}.` }),
                              onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
                            }
                          );
                        }}
                      >
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Weight"}
                      </Button>
                    )}
                  </div>
                  {order.status !== "completed" && (
                    <p className="text-xs text-muted-foreground mt-2">Saving the actual weight will recalculate the total based on the service rate.</p>
                  )}
                </div>
              )}

              {/* Promo Discount Section — visible only for pending (accepted) orders */}
              {order.status === "pending" && (
                <div className="bg-background/50 rounded-2xl p-5 border border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <BadgePercent className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Promo Discount</h4>
                  </div>

                  {order.promoId ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-emerald-600" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-800">{order.promoName}</p>
                            <p className="text-xs text-emerald-600">-₱{parseFloat(String(order.discountAmount)).toFixed(2)} off from ₱{baseTotal.toFixed(2)}</p>
                          </div>
                        </div>
                        <Button
                          data-testid="button-remove-promo"
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 text-xs"
                          onClick={handleRemovePromo}
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activePromos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active promos available.</p>
                      ) : (
                        <>
                          <Select
                            value={selectedPromoId}
                            onValueChange={setSelectedPromoId}
                          >
                            <SelectTrigger data-testid="select-promo" className="rounded-xl bg-background border-border/50">
                              <SelectValue placeholder="Select a promo..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/50">
                              {activePromos.map((promo) => (
                                <SelectItem key={promo.id} value={String(promo.id)}>
                                  {promo.name} — {promo.discount}% off
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {selectedPromo && (
                            <div className="bg-muted/40 rounded-xl px-4 py-3 border border-border/50 space-y-1.5 text-sm">
                              <div className="flex justify-between text-muted-foreground">
                                <span>Original Total</span>
                                <span>₱{baseTotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-emerald-600 font-medium">
                                <span>Discount ({selectedPromo.discount}%)</span>
                                <span>-₱{previewDiscount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-foreground border-t border-border/50 pt-1.5 mt-1.5">
                                <span>New Total</span>
                                <span>₱{previewTotal.toFixed(2)}</span>
                              </div>
                            </div>
                          )}

                          <Button
                            data-testid="button-apply-promo"
                            size="sm"
                            className="rounded-xl w-full"
                            onClick={handleApplyPromo}
                            disabled={!selectedPromo || isUpdating}
                          >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Percent className="w-4 h-4 mr-2" />}
                            Apply Discount
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {order.notes && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-200/60 dark:border-amber-800/40">
                  <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">Special Instructions</h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}

              {/* Print / Email Menu */}
              {showPrintMenu && (
                <div className="bg-background/50 rounded-2xl p-4 border border-border/50">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Print</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      data-testid="print-sticker"
                      onClick={() => { printSticker(order); setShowPrintMenu(false); }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-primary/40 transition-all text-sm"
                    >
                      <Sticker className="w-5 h-5 text-primary" />
                      <span className="font-medium">Laundry Sticker</span>
                      <span className="text-xs text-muted-foreground text-center">Print & attach to bag</span>
                    </button>
                    <button
                      data-testid="print-receipt"
                      onClick={() => { printReceipt(order, order.status === "completed" ? "pickup" : "dropoff"); setShowPrintMenu(false); }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-primary/40 transition-all text-sm"
                    >
                      <ReceiptText className="w-5 h-5 text-primary" />
                      <span className="font-medium">Print Receipt</span>
                      <span className="text-xs text-muted-foreground text-center">Print customer receipt</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-2 flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
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
                  <Pencil className="w-4 h-4" />Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-xl gap-2 ${showPrintMenu ? "bg-primary/10 border-primary/40 text-primary" : ""}`}
                  onClick={() => setShowPrintMenu((v) => !v)}
                  data-testid="button-print"
                >
                  <Printer className="w-4 h-4" />Print
                </Button>
              </div>

              <div className="flex gap-3">
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
