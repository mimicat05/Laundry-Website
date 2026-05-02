import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Droplets, LogOut, Plus, Package, CheckCircle2,
  ChevronRight, ClipboardList, Wind, Layers, ShoppingBag, Star, UserCog, XCircle,
  BadgePercent, ImagePlus, Clock, CheckCircle, Loader2, MessageSquare, Send,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Order, type PublicCustomer, type Promo, type Feedback, type Message } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  cancelled:        "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABEL: Record<string, string> = {
  requested: "Submitted", pending: "Accepted", received: "Received",
  washing: "Washing", drying: "Drying", folding: "Folding",
  ready_for_pickup: "Ready for Pickup", completed: "Completed",
  cancelled: "Cancelled",
};

const CANCELLABLE = ["requested", "pending"];

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
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [form, setForm] = useState({
    name: customer.name,
    email: customer.email,
    contactNumber: customer.contactNumber,
    address: customer.address,
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const profileMutation = useMutation({
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

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiRequest("POST", "/api/customer/change-password", data).then((r) => r.json()),
    onSuccess: () => {
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onClose();
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to change password", description: err.message, variant: "destructive" });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate(form);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }
    passwordMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setTab("profile"); onClose(); } }}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Account Settings</DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mt-1">
          <button
            type="button"
            onClick={() => setTab("profile")}
            data-testid="tab-profile"
            className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors ${tab === "profile" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setTab("password")}
            data-testid="tab-password"
            className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors ${tab === "password" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Change Password
          </button>
        </div>

        {tab === "profile" ? (
          <form onSubmit={handleProfileSubmit} className="space-y-4 mt-2">
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
                disabled={profileMutation.isPending}
                data-testid="button-save-profile"
              >
                {profileMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                data-testid="input-current-password"
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                className="rounded-xl"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                data-testid="input-new-password"
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                className="rounded-xl"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                data-testid="input-confirm-password"
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className="rounded-xl"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={passwordMutation.isPending}
                data-testid="button-save-password"
              >
                {passwordMutation.isPending ? "Updating…" : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          data-testid={`star-${s}`}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              s <= (hovered || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function SendMessageDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ subject: "", message: "" });

  const sendMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/customer/messages", form).then((r) => r.json()),
    onSuccess: () => {
      toast({ title: "Message sent!", description: "Our staff will get back to you soon." });
      setForm({ subject: "", message: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/messages"] });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Could not send message", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    sendMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setForm({ subject: "", message: "" }); onClose(); } }}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Send a Message
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Have a question or concern? Send us a message and we'll get back to you.</p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label htmlFor="msg-subject">Subject</Label>
            <Input
              id="msg-subject"
              data-testid="input-message-subject"
              placeholder="e.g. Question about my order"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="msg-body">Message</Label>
            <Textarea
              id="msg-body"
              data-testid="input-message-body"
              placeholder="Write your message here..."
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="rounded-xl min-h-[120px] resize-none"
              required
            />
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl gap-2"
              disabled={sendMutation.isPending || !form.subject.trim() || !form.message.trim()}
              data-testid="button-send-message"
            >
              {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OrderTrackingDialog({
  order, open, onClose,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [selectedPromoId, setSelectedPromoId] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: promos } = useQuery<Promo[]>({ queryKey: ["/api/promos"] });

  const { data: existingFeedback } = useQuery<Feedback | null>({
    queryKey: ["/api/feedback/order", order?.orderId],
    queryFn: () =>
      order
        ? fetch(`/api/feedback/order/${order.orderId}`).then((r) => r.json())
        : Promise.resolve(null),
    enabled: !!order && order.status === "completed",
  });

  const feedbackMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/customer/feedback", {
        orderId: order!.orderId,
        rating,
        comment: comment.trim() || null,
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/order", order?.orderId] });
      toast({ title: "Thank you for your feedback!", description: "Your rating has been submitted." });
      setShowFeedbackForm(false);
    },
    onError: (err: any) => {
      toast({ title: "Could not submit feedback", description: err.message, variant: "destructive" });
    },
  });
  const activePromos = (promos || []).filter((p) => p.active);

  const cancelMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/customer/orders/${id}/cancel`).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
      toast({ title: "Order cancelled", description: "Your order has been cancelled." });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Could not cancel", description: err.message, variant: "destructive" });
    },
  });

  const claimMutation = useMutation({
    mutationFn: ({ id, promoClaimName, promoPhoto }: { id: number; promoClaimName: string; promoPhoto: string }) =>
      apiRequest("POST", `/api/customer/orders/${id}/promo-claim`, { promoClaimName, promoPhoto }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
      toast({ title: "Promo claim submitted", description: "Our staff will review your photo and apply the discount." });
      setShowPromoForm(false);
      setSelectedPromoId("");
      setPhotoDataUrl(null);
    },
    onError: (err: any) => {
      toast({ title: "Could not submit claim", description: err.message, variant: "destructive" });
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a photo smaller than 3MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitClaim = () => {
    if (!order || !selectedPromoId || !photoDataUrl) return;
    const promo = activePromos.find((p) => String(p.id) === selectedPromoId);
    if (!promo) return;
    claimMutation.mutate({ id: order.id, promoClaimName: promo.name, promoPhoto: photoDataUrl });
  };

  if (!order) return null;

  const isCancelled = order.status === "cancelled";
  const canCancel = CANCELLABLE.includes(order.status);
  const canClaimPromo = ["requested", "pending"].includes(order.status) && !order.promoId && !order.promoClaimStatus;
  const currentIdx = STAGE_KEYS.indexOf(order.status);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setShowPromoForm(false); setPhotoDataUrl(null); setSelectedPromoId(""); } }}>
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
            {!isCancelled && (order.paid ? (
              <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">Paid</span>
            ) : (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">Payment Pending</span>
            ))}
          </div>

          {/* Cancelled notice */}
          {isCancelled ? (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mt-1">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">This order was cancelled and will not be processed.</p>
            </div>
          ) : (
            /* Progress */
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
          )}

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

          {/* Promo Claim Status */}
          {order.promoClaimStatus === "pending" && !order.promoId && (
            <div className="border-t border-border/50 pt-4 mt-2">
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Promo Claim Under Review</p>
                  <p className="text-xs text-amber-600">Your claim for <strong>{order.promoClaimName}</strong> is being reviewed by our staff.</p>
                </div>
              </div>
            </div>
          )}
          {order.promoClaimStatus === "rejected" && !order.promoId && (
            <div className="border-t border-border/50 pt-4 mt-2">
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Promo Claim Rejected</p>
                  <p className="text-xs text-red-600">Your claim for <strong>{order.promoClaimName}</strong> was not approved by our staff.</p>
                </div>
              </div>
            </div>
          )}

          {/* Claim Promo Section */}
          {canClaimPromo && activePromos.length > 0 && (
            <div className="border-t border-border/50 pt-4 mt-2">
              {!showPromoForm ? (
                <Button
                  variant="outline"
                  className="w-full rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5"
                  onClick={() => setShowPromoForm(true)}
                  data-testid="button-claim-promo"
                >
                  <BadgePercent className="w-4 h-4" />
                  Claim a Promo
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BadgePercent className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Claim a Promo Discount</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Select the promo you qualify for and upload a photo as proof (e.g. coupon, ID, screenshot). Our staff will review and apply it.</p>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Select Promo</Label>
                    <Select value={selectedPromoId} onValueChange={setSelectedPromoId}>
                      <SelectTrigger data-testid="select-promo-claim" className="rounded-xl">
                        <SelectValue placeholder="Choose a promo..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {activePromos.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name} — {p.discount}% off
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Upload Proof Photo</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                      data-testid="input-promo-photo"
                    />
                    {photoDataUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-border">
                        <img src={photoDataUrl} alt="Promo proof" className="w-full max-h-40 object-cover" />
                        <button
                          onClick={() => { setPhotoDataUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                        data-testid="button-upload-photo"
                      >
                        <ImagePlus className="w-6 h-6" />
                        <span className="text-xs">Tap to upload photo (max 3MB)</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={() => { setShowPromoForm(false); setSelectedPromoId(""); setPhotoDataUrl(null); }}
                      disabled={claimMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 rounded-xl"
                      onClick={handleSubmitClaim}
                      disabled={!selectedPromoId || !photoDataUrl || claimMutation.isPending}
                      data-testid="button-submit-promo-claim"
                    >
                      {claimMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Submit Claim
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback section for completed orders */}
          {order.status === "completed" && (
            <div className="border-t border-border/50 pt-4 mt-2">
              {existingFeedback ? (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">Feedback Submitted</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= existingFeedback.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  {existingFeedback.comment && (
                    <p className="text-sm text-muted-foreground">"{existingFeedback.comment}"</p>
                  )}
                </div>
              ) : !showFeedbackForm ? (
                <Button
                  variant="outline"
                  className="w-full rounded-xl gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-950/20"
                  onClick={() => setShowFeedbackForm(true)}
                  data-testid="button-leave-feedback"
                >
                  <Star className="w-4 h-4" />
                  Leave Feedback
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">How was your experience?</p>
                  <StarPicker value={rating} onChange={setRating} />
                  <div className="space-y-1">
                    <Label htmlFor="feedback-comment" className="text-xs text-muted-foreground">Comment (optional)</Label>
                    <Textarea
                      id="feedback-comment"
                      data-testid="input-feedback-comment"
                      placeholder="Tell us about your experience..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="rounded-xl min-h-[80px] resize-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={() => { setShowFeedbackForm(false); setRating(0); setComment(""); }}
                      disabled={feedbackMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 rounded-xl gap-2"
                      onClick={() => feedbackMutation.mutate()}
                      disabled={rating === 0 || feedbackMutation.isPending}
                      data-testid="button-submit-feedback"
                    >
                      {feedbackMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Submit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cancel button */}
          {canCancel && (
            <div className="border-t border-border/50 pt-4 mt-2">
              <Button
                variant="outline"
                className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
                onClick={() => setConfirmCancel(true)}
                disabled={cancelMutation.isPending}
                data-testid="button-cancel-order"
              >
                <XCircle className="w-4 h-4" />
                Cancel Order
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel <span className="font-semibold">{order.orderId}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" data-testid="button-cancel-no">Keep Order</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
              onClick={() => cancelMutation.mutate(order.id)}
              data-testid="button-cancel-confirm"
            >
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
  const [sendMessageOpen, setSendMessageOpen] = useState(false);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/customer/orders"],
    enabled: !!customer,
  });

  const { data: myMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/customer/messages"],
    enabled: !!customer,
  });

  const unreadReplies = myMessages.filter((m) => m.staffReply).length;

  const handleLogout = async () => {
    await logoutCustomer();
    setLocation("/");
  };

  const activeOrders = (orders || []).filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const completedOrders = (orders || []).filter((o) => o.status === "completed");
  const cancelledOrders = (orders || []).filter((o) => o.status === "cancelled");

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
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl gap-1.5 text-muted-foreground relative"
              onClick={() => setSendMessageOpen(true)}
              data-testid="button-send-message-nav"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Message Us</span>
              {unreadReplies > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadReplies}
                </span>
              )}
            </Button>
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
              Welcome back!
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
            <p className="text-2xl font-bold text-foreground font-display">{activeOrders.length + completedOrders.length}</p>
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

            {/* Cancelled orders */}
            {cancelledOrders.length > 0 && (
              <>
                <h2 className={`font-display font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3 ${(activeOrders.length > 0 || completedOrders.length > 0) ? "mt-6" : ""}`}>
                  Cancelled Orders
                </h2>
                {cancelledOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* My Messages section */}
      {myMessages.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 pb-10">
          <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3 mt-2">
            My Messages
          </h2>
          <div className="space-y-3">
            {myMessages.map((msg) => (
              <Card key={msg.id} className="rounded-2xl border border-border/50" data-testid={`card-my-message-${msg.id}`}>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold text-foreground">{msg.subject}</span>
                        {msg.staffReply && (
                          <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0 h-4 rounded-full">Replied</Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(msg.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                  {msg.staffReply && (
                    <div className="ml-11 pl-3 border-l-2 border-primary/30 bg-primary/5 rounded-r-xl py-2 pr-3">
                      <p className="text-xs font-medium text-primary mb-1">
                        Reply from {msg.repliedByName}
                        {msg.repliedAt && (
                          <span className="text-muted-foreground font-normal ml-1">
                            · {new Date(msg.repliedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed" data-testid={`text-staff-reply-${msg.id}`}>
                        {msg.staffReply}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

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

      <SendMessageDialog open={sendMessageOpen} onClose={() => setSendMessageOpen(false)} />
    </div>
  );
}
