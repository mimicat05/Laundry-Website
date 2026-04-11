import { useState } from "react";
import { Link } from "wouter";
import {
  Droplets, Search, ArrowLeft, CheckCircle2, Circle, Package,
  Shirt, Wind, Layers, ShoppingBag, Star, ClipboardList,
  Calendar, CreditCard, Weight, Tag, FileText, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Order } from "@shared/schema";

const STAGES: { key: string; label: string; icon: React.ElementType }[] = [
  { key: "requested",       label: "Order Submitted",   icon: ClipboardList },
  { key: "pending",         label: "Accepted",          icon: CheckCircle2 },
  { key: "received",        label: "Received at Shop",  icon: Package },
  { key: "washing",         label: "Washing",           icon: Droplets },
  { key: "drying",          label: "Drying",            icon: Wind },
  { key: "folding",         label: "Folding & Packing", icon: Layers },
  { key: "ready_for_pickup",label: "Ready for Pickup",  icon: ShoppingBag },
  { key: "completed",       label: "Completed",         icon: Star },
];

const STATUS_ORDER = STAGES.map((s) => s.key);

function getStageIndex(status: string) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

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

export function CustomerTracking() {
  const [orderId, setOrderId] = useState("");
  const [contact, setContact] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setOrder(null);
    setSearched(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim(), contact: contact.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Order not found.");
        return;
      }
      setOrder(data);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentStageIndex = order ? getStageIndex(order.status) : -1;
  const stageLabel = order ? (STAGES[currentStageIndex]?.label ?? order.status) : "";

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
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-xl gap-1.5 text-muted-foreground" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-5">
            <Search className="w-7 h-7" />
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-3">Track Your Order</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Enter your Order ID and the email or contact number you used when placing the order.
          </p>
        </div>

        {/* Search Form */}
        <Card className="rounded-3xl border border-border/50 p-8 shadow-sm mb-8">
          <form onSubmit={handleSearch} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="orderId" className="text-foreground/80 ml-1">Order ID</Label>
                <Input
                  id="orderId"
                  data-testid="input-order-id"
                  placeholder="e.g. ORD1234"
                  className="rounded-xl h-11 bg-background/50 border-border/50 focus:bg-background transition-all"
                  value={orderId}
                  onChange={(e) => { setOrderId(e.target.value); setError(""); }}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact" className="text-foreground/80 ml-1">Email or Contact Number</Label>
                <Input
                  id="contact"
                  data-testid="input-contact"
                  placeholder="e.g. juan@gmail.com or 09..."
                  className="rounded-xl h-11 bg-background/50 border-border/50 focus:bg-background transition-all"
                  value={contact}
                  onChange={(e) => { setContact(e.target.value); setError(""); }}
                  autoComplete="off"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive" data-testid="text-track-error">
                {error}
              </div>
            )}

            <Button
              type="submit"
              data-testid="button-track"
              disabled={isLoading || !orderId.trim() || !contact.trim()}
              className="w-full rounded-xl h-11 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Searching...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" /> Track Order
                </span>
              )}
            </Button>
          </form>
        </Card>

        {/* Results */}
        {order && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Header */}
            <Card className="rounded-3xl border border-border/50 p-6 shadow-sm" data-testid="card-order-result">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Order ID</p>
                  <p className="font-display text-2xl font-bold text-foreground" data-testid="text-order-id">{order.orderId}</p>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="text-customer-name">{order.customerName}</p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <Badge
                    variant="outline"
                    className={`text-sm px-3 py-1 font-medium ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-700"}`}
                    data-testid="badge-order-status"
                  >
                    {stageLabel}
                  </Badge>
                  {order.paid ? (
                    <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg" data-testid="badge-paid">Paid</span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg" data-testid="badge-unpaid">Payment Pending</span>
                  )}
                </div>
              </div>
            </Card>

            {/* Progress Timeline */}
            <Card className="rounded-3xl border border-border/50 p-6 shadow-sm">
              <h2 className="font-display font-semibold text-foreground mb-6">Order Progress</h2>
              <div className="relative">
                {STAGES.map((stage, idx) => {
                  const isDone = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  const isUpcoming = idx > currentStageIndex;
                  const Icon = stage.icon;

                  return (
                    <div key={stage.key} className="flex gap-4" data-testid={`step-${stage.key}`}>
                      {/* Icon column */}
                      <div className="flex flex-col items-center">
                        <div className={`
                          w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors
                          ${isDone ? "bg-primary text-primary-foreground" : ""}
                          ${isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : ""}
                          ${isUpcoming ? "bg-muted text-muted-foreground" : ""}
                        `}>
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isCurrent ? (
                            <Icon className="w-4.5 h-4.5" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </div>
                        {idx < STAGES.length - 1 && (
                          <div className={`w-0.5 h-8 mt-1 mb-1 rounded-full transition-colors ${isDone ? "bg-primary" : "bg-border"}`} />
                        )}
                      </div>

                      {/* Label column */}
                      <div className={`pb-6 pt-1.5 ${idx === STAGES.length - 1 ? "pb-0" : ""}`}>
                        <p className={`text-sm font-medium leading-tight ${
                          isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {stage.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-muted-foreground mt-0.5">Current status</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Order Details */}
            <Card className="rounded-3xl border border-border/50 p-6 shadow-sm">
              <h2 className="font-display font-semibold text-foreground mb-5">Order Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Shirt className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Service</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5" data-testid="text-service">{order.service}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Weight className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Weight</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5" data-testid="text-weight">
                      {order.actualWeight
                        ? <>{Number(order.actualWeight).toFixed(2)} kg <span className="text-xs font-normal text-muted-foreground">(actual)</span></>
                        : <>{Number(order.weight).toFixed(2)} kg <span className="text-xs font-normal text-muted-foreground">(estimated)</span></>
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Amount</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5" data-testid="text-total">
                      ₱{Number(order.total).toFixed(2)}
                      {order.discountAmount && Number(order.discountAmount) > 0 && (
                        <span className="ml-1.5 text-xs font-normal text-green-600">(−₱{Number(order.discountAmount).toFixed(2)} discount)</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Date Placed</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5" data-testid="text-date">
                      {new Date(order.createdAt).toLocaleDateString("en-PH", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {order.promoName && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Promo Applied</p>
                      <p className="text-sm font-semibold text-green-700 mt-0.5" data-testid="text-promo">{order.promoName}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Contact</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5" data-testid="text-contact">{order.contactNumber}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="sm:col-span-2 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Special Instructions</p>
                      <p className="text-sm text-foreground mt-0.5 leading-relaxed" data-testid="text-notes">{order.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Help note */}
            <p className="text-center text-sm text-muted-foreground pb-4">
              Have questions about your order?{" "}
              <Link href="/#contact">
                <span className="text-primary hover:underline cursor-pointer">Contact us</span>
              </Link>
            </p>
          </div>
        )}

        {/* Empty state after search with no result */}
        {searched && !order && !error && !isLoading && (
          <div className="text-center text-muted-foreground py-10">
            No order found.
          </div>
        )}
      </div>
    </div>
  );
}
