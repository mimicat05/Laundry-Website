import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Droplets, Loader2, CheckCircle2, Tag, BadgePercent, ImagePlus, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { type Service, type Promo } from "@shared/schema";
import { useCustomerAuth } from "@/hooks/use-customer-auth";

const formSchema = z.object({
  customerName: z.string().min(2, "Please enter your full name"),
  address: z.string().min(5, "Please enter your full address"),
  contactNumber: z
    .string()
    .regex(
      /^(09|\+639)\d{9}$/,
      "Please enter a valid mobile number"
    ),
  email: z
    .string()
    .regex(
      /^[a-zA-Z0-9._%+\-]+@gmail\.com$/,
      "Enter a valid Gmail address"
    ),
  service: z.string().min(1, "Please select a service"),
  weight: z
  .string()
  .refine((val) => parseFloat(val) > 0, {
    message: "Weight must be greater than 0",
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CustomerOrder() {
  const [_, setLocation] = useLocation();
  const { customer, isLoading: authLoading } = useCustomerAuth();
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [selectedPromoId, setSelectedPromoId] = useState("");
  const [promoPhotoDataUrl, setPromoPhotoDataUrl] = useState<string | null>(null);
  const promoFileInputRef = useRef<HTMLInputElement>(null);
  const { data: serviceList } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: promoList } = useQuery<Promo[]>({ queryKey: ["/api/promos"] });
  const activeServices = (serviceList || []).filter((s) => s.active);
  const activePromos = (promoList || []).filter((p) => p.active);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !customer) {
      setLocation("/customer/login");
    }
  }, [authLoading, customer, setLocation]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      customerName: "",
      address: "",
      contactNumber: "",
      email: "",
      service: "",
      weight: "",
      notes: "",
    },
  });

  // Pre-fill form with customer data once loaded
  useEffect(() => {
    if (customer) {
      form.setValue("customerName", customer.name);
      form.setValue("email", customer.email);
      form.setValue("contactNumber", customer.contactNumber);
      form.setValue("address", customer.address);
    }
  }, [customer]);

  const watchedService = form.watch("service");
  const watchedWeight = form.watch("weight");

  const computedTotal = (() => {
    const svc = activeServices.find((s) => s.name === watchedService);
    const pricePerKg = svc ? Number(svc.pricePerKg) : 0;
    const kg = parseFloat(watchedWeight);
    if (pricePerKg > 0 && !isNaN(kg) && kg > 0) {
      return (pricePerKg * kg).toFixed(2);
    }
    return null;
  })();

  const handlePromoPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a photo smaller than 3MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPromoPhotoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const selectedPromo = activePromos.find((p) => String(p.id) === selectedPromoId);

  const onSubmit = async (data: FormValues) => {
    if (selectedPromoId && !promoPhotoDataUrl) {
      toast({ title: "Photo required", description: "Please upload a proof photo for your promo claim.", variant: "destructive" });
      return;
    }
    setIsPending(true);
    try {
      const body: Record<string, any> = { ...data, total: computedTotal || "0" };
      if (selectedPromo && promoPhotoDataUrl) {
        body.promoClaimName = selectedPromo.name;
        body.promoPhoto = promoPhotoDataUrl;
      }
      const res = await fetch("/api/orders/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to submit" }));
        throw new Error(err.message || "Failed to submit");
      }
      const order = await res.json();
      setOrderId(order.orderId);
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="bg-card border border-border/50 rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Request Submitted!</h2>
          <p className="text-muted-foreground mb-2">Your order <span className="font-semibold text-foreground">{orderId}</span> has been received.</p>
          <p className="text-muted-foreground text-sm mb-8">
            Our staff will review your request and send you a confirmation email once it's accepted. Please wait for the confirmation before dropping off your clothes.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/customer/dashboard">
              <Button className="rounded-xl w-full">Go to My Dashboard</Button>
            </Link>
            <Button
              variant="outline"
              className="rounded-xl w-full"
              onClick={() => { setSubmitted(false); form.reset({ service: "", weight: "", notes: "" }); if (customer) { form.setValue("customerName", customer.name); form.setValue("email", customer.email); form.setValue("contactNumber", customer.contactNumber); form.setValue("address", customer.address); } }}
            >
              Place Another Order
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 text-primary cursor-pointer">
              <Droplets className="w-6 h-6" />
              <span className="font-display font-bold text-xl text-foreground">Lavanderia Sunrise</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="rounded-xl text-sm">Back to Home</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground mb-3">Place a Laundry Order</h1>
          <p className="text-muted-foreground text-lg">
            Fill in your details below. Our staff will review your request and confirm via email before you drop off your clothes.
          </p>
        </div>

        {activePromos.length > 0 && (
          <div className="mb-6 bg-card border border-border/50 rounded-3xl p-6 shadow-sm" data-testid="section-active-promos">
            <div className="flex items-center gap-2 mb-4">
              <BadgePercent className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Have a Promo?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select the promo you qualify for and upload a photo as proof (e.g. senior ID, student ID, coupon). Our staff will review and apply the discount.
            </p>

            {/* Promo selector */}
            <div className="grid grid-cols-1 gap-3 mb-4">
              {activePromos.map((promo) => (
                <button
                  key={promo.id}
                  type="button"
                  data-testid={`button-promo-${promo.id}`}
                  onClick={() => setSelectedPromoId(selectedPromoId === String(promo.id) ? "" : String(promo.id))}
                  className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-left transition-all ${
                    selectedPromoId === String(promo.id)
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border/50 bg-background hover:border-primary/40 hover:bg-primary/3"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedPromoId === String(promo.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    <Tag className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      {promo.name}{" "}
                      <span className="text-primary">— {Number(promo.discount).toFixed(0)}% off</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{promo.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedPromoId === String(promo.id) ? "border-primary bg-primary" : "border-border"
                  }`}>
                    {selectedPromoId === String(promo.id) && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Photo upload — only shown when a promo is selected */}
            {selectedPromoId && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upload Proof Photo <span className="text-red-500">*</span></p>
                <input
                  ref={promoFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePromoPhotoChange}
                  data-testid="input-promo-photo"
                />
                {promoPhotoDataUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={promoPhotoDataUrl} alt="Promo proof" className="w-full max-h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPromoPhotoDataUrl(null); if (promoFileInputRef.current) promoFileInputRef.current.value = ""; }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                      data-testid="button-remove-promo-photo"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                      Photo uploaded
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => promoFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                    data-testid="button-upload-promo-photo"
                  >
                    <ImagePlus className="w-7 h-7" />
                    <span className="text-sm font-medium">Tap to upload proof photo</span>
                    <span className="text-xs">Max 3MB · JPG, PNG, etc.</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan dela Cruz" className="rounded-xl bg-muted/50" readOnly={!!customer} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="09171234567"
                          className="rounded-xl bg-muted/50"
                          inputMode="tel"
                          maxLength={13}
                          readOnly={!!customer}
                          data-testid="input-contact-number"
                          {...field}
                          onChange={(e) => {
                            if (customer) return;
                            const raw = e.target.value;
                            const cleaned = raw.startsWith("+")
                              ? "+" + raw.slice(1).replace(/\D/g, "")
                              : raw.replace(/\D/g, "");
                            field.onChange(cleaned);
                          }}
                        />
                      </FormControl>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Gmail Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="yourname@gmail.com"
                          className="rounded-xl bg-muted/50"
                          readOnly={!!customer}
                          data-testid="input-email"
                          {...field}
                        />
                      </FormControl>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Mabini St, Calaca, Batangas" className="rounded-xl bg-muted/50" readOnly={!!customer} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>
                        Special Instructions{" "}
                        <span className="text-muted-foreground font-normal">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <textarea
                          placeholder=" No fabric softener, handle delicates gently, separate whites..."
                          rows={3}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Service Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {activeServices.map((svc) => (
                            <SelectItem key={svc.id} value={svc.name}>
                              {svc.name} (₱{Number(svc.pricePerKg).toFixed(0)}/kg)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="e.g. 3.5"
                          className="rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col justify-end">
                  <p className="text-sm font-medium mb-2 text-foreground/80">Estimated Total</p>
                  <div className="h-10 rounded-xl bg-muted/50 border border-border/50 flex items-center px-4">
                    {computedTotal ? (
                      <span className="font-semibold text-foreground text-lg">₱{computedTotal}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Select service &amp; enter weight</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-4">
                  By submitting, you'll receive a confirmation email once our staff accepts your order.
                </p>
                <Button type="submit" className="w-full rounded-xl py-6 text-base" disabled={isPending}>
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Submit Order Request
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
