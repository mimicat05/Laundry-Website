import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Droplets, LogOut, Plus, Package, CheckCircle2,
  ChevronRight, ClipboardList, Wind, Layers, ShoppingBag, Star, UserCog,
} from "lucide-react";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Order, type PublicCustomer } from "@shared/schema";

const STAGES: { key: string; label: string; icon: React.ElementType }[] = [
  { key: "requested",        label: "Order Submitted",    icon: ClipboardList },
  { key: "pending",          label: "Accepted",           icon: CheckCircle2 },
  { key: "received",         label: "Received at Shop",   icon: Package },
  { key: "washing",          label: "Washing",            icon: Droplets },
  { key: "drying",           label: "Drying",             icon: Wind },
  { key: "folding",          label: "Folding & Packing",  icon: Layers },
  { key: "ready_for_pickup", label: "Ready for Pickup",   icon: ShoppingBag },
  { key: "completed",        label: "Completed",          icon: Star },
];
const STAGE_KEYS = STAGES.map((s) => s.key);

const STATUS_BADGE: Record<string, string> = {
  requested:        "bg-gray-100 text-gray-700 border-gray-200",
  pending:          "bg-blue-100 text-blue-700 border-blue-200",
  received:         "bg-indigo-100 text-indigo-700 border-indigo-200",
  washing:          "bg-cyan-100 text-cyan-700 border-cyan-200",
  drying:           "bg-sky-100 text-sky-700 border-sky-200",
  folding:          "bg-violet-100 text-violet-700 border-violet-200",
  ready_for_pickup: "bg-amber-100 text-amber-700 border-amber-200",
  completed:        "bg-green-100 text-green-700 border-green-200",
};

const STATUS_LABEL: Record<string, string> = {
  requested: "Submitted", pending: "Accepted", received: "Received",
  washing: "Washing", drying: "Drying", folding: "Folding",
  ready_for_pickup: "Ready for Pickup", completed: "Completed",
};

function EditProfileDialog({
  customer,
  open,
  onClose,
  onSaved,
}: {
  customer: PublicCustomer;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: PublicCustomer) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: customer.name,
    email: customer.email,
    contactNumber: customer.contactNumber,
    address: customer.address,
  });

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiRequest("PATCH", "/api/customer/me", data).then((r) => r.json()),
    onSuccess: (updated: PublicCustomer) => {
      localStorage.setItem("customer_data", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
      onSaved(updated);
      onClose();
      toast({ title: "Profile updated", description: "Your information has been saved." });
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              data-testid="input-edit-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              data-testid="input-edit-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-contact">Contact Number</Label>
            <Input
              id="edit-contact"
              data-testid="input-edit-contact"
              value={form.contactNumber}
              onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))}
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-address">Address</Label>
            <Input
              id="edit-address"
              data-testid="input-edit-address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="rounded-xl"
              required
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl"
              disabled={mutation.isPending}
              data-testid="button-save-profile"
            >
              {mutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OrderTrackingDialog({ order, open, onClose }: { order: Order | null; open: boolean; onClose: () => void }) {
  if (!order) return null;
  const currentIdx = STAGE_KEYS.indexOf(order.status);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {order.orderId}
          </DialogTitle>
        </DialogHeader>

        {/* Status & payment */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-xs px-2.5 py-1 ${STATUS_BADGE[order.status] ?? ""}`}>
            {STATUS_LABEL[order.status] ?? order.status}
          </Badge>
          {order.paid ? (
            <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">Paid</span>
          ) : (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">Payment Pending</span>
          )}
        </div>

        {/* Progress */}
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Order Progress</p>
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                    ${isDone ? "bg-primary text-primary-foreground" : ""}
                    ${isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : ""}
                    ${!isDone && !isCurrent ? "bg-muted text-muted-foreground" : ""}
                  `}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={`w-0.5 h-6 mt-0.5 mb-0.5 rounded-full ${isDone ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
                <div className={`pt-1.5 pb-5 ${idx === STAGES.length - 1 ? "pb-0" : ""}`}>
                  <p className={`text-sm font-medium ${isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                    {stage.label}
                  </p>
                  {isCurrent && <p className="text-xs text-muted-foreground">Current status</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Details */}
        <div className="border-t border-border/50 pt-4 mt-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Service</p>
            <p className="text-sm font-semibold">{order.service}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Weight</p>
            <p className="text-sm font-semibold">
              {order.actualWeight ? `${Number(order.actualWeight).toFixed(2)} kg` : `${Number(order.weight).toFixed(2)} kg (est.)`}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Total</p>
            <p className="text-sm font-semibold">₱{Number(order.total).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Date</p>
            <p className="text-sm font-semibold">
              {new Date(order.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          {order.promoName && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Promo</p>
              <p className="text-sm font-semibold text-green-600">{order.promoName} (−₱{Number(order.discountAmount).toFixed(2)})</p>
            </div>
          )}
          {order.notes && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Notes</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const statusLabel = STATUS_LABEL[order.status] ?? order.status;
  const badgeClass = STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-700";

  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
      data-testid={`card-order-${order.id}`}
    >
      <Card className="border border-border/50 rounded-2xl p-5 hover:shadow-md hover:border-primary/20 transition-all bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-display font-bold text-foreground text-sm" data-testid={`text-order-id-${order.id}`}>{order.orderId}</span>
              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${badgeClass}`} data-testid={`badge-status-${order.id}`}>
                {statusLabel}
              </Badge>
              {order.paid && (
                <span className="text-xs text-green-600 font-medium">Paid</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{order.service}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>₱{Number(order.total).toFixed(2)}</span>
              <span>·</span>
              <span>{Number(order.actualWeight ?? order.weight).toFixed(2)} kg</span>
              <span>·</span>
              <span>{new Date(order.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
        </div>
      </Card>
    </button>
  );
}

export function CustomerDashboard() {
  const [_, setLocation] = useLocation();
  const { customer, logoutCustomer, loginCustomer } = useCustomerAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/customer/orders"],
    enabled: !!customer,
  });

  const handleLogout = async () => {
    await logoutCustomer();
    setLocation("/");
  };

  const activeOrders = (orders || []).filter((o) => o.status !== "completed");
  const completedOrders = (orders || []).filter((o) => o.status === "completed");

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">Lavanderia Sunrise</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block" data-testid="text-customer-name">
              Hi, {customer?.name?.split(" ")[0]}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl gap-1.5 text-muted-foreground"
              onClick={() => setEditProfileOpen(true)}
              data-testid="button-edit-profile"
            >
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Profile</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl gap-1.5 text-muted-foreground"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Out</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome back, {customer?.name?.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">Track your laundry orders and manage your account.</p>
          </div>
          <Link href="/order">
            <Button className="rounded-xl gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all shrink-0" data-testid="button-new-order">
              <Plus className="w-4 h-4" />
              New Order
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="rounded-2xl border border-border/50 p-5 text-center" data-testid="card-stat-total">
            <p className="text-2xl font-bold text-foreground font-display">{(orders || []).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
          </Card>
          <Card className="rounded-2xl border border-border/50 p-5 text-center" data-testid="card-stat-active">
            <p className="text-2xl font-bold text-primary font-display">{activeOrders.length}</p>
            <p className="text-xs text-muted-foreground mt-1">In Progress</p>
          </Card>
          <Card className="rounded-2xl border border-border/50 p-5 text-center" data-testid="card-stat-completed">
            <p className="text-2xl font-bold text-green-600 font-display">{completedOrders.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </Card>
        </div>

        {/* Orders */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (orders || []).length === 0 ? (
          <Card className="rounded-3xl border border-border/50 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">No orders yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Place your first laundry order to get started.</p>
            <Link href="/order">
              <Button className="rounded-xl gap-2" data-testid="button-first-order">
                <Plus className="w-4 h-4" /> Place an Order
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Active orders */}
            {activeOrders.length > 0 && (
              <>
                <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wide text-muted-foreground mb-3">
                  Active Orders
                </h2>
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
                ))}
              </>
            )}

            {/* Completed orders */}
            {completedOrders.length > 0 && (
              <>
                <h2 className={`font-display font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3 ${activeOrders.length > 0 ? "mt-6" : ""}`}>
                  Completed Orders
                </h2>
                {completedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <OrderTrackingDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {customer && (
        <EditProfileDialog
          customer={customer}
          open={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          onSaved={(updated) => loginCustomer(updated)}
        />
      )}
    </div>
  );
}
