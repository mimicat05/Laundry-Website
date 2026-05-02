import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2, BadgePercent, Tag, ImagePlus, XCircle, Percent } from "lucide-react";
import { useCreateOrder } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
import { type Service, type Promo } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  customerName: z.string().min(2, "Please enter your full name"),
  address: z.string().min(5, "Please enter the full address"),
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
  total: z.string().min(1, "Total is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateOrderDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { toast } = useToast();
  const { data: serviceList } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: promoList } = useQuery<Promo[]>({ queryKey: ["/api/promos"] });
  const activeServices = useMemo(() => (serviceList || []).filter((s) => s.active), [serviceList]);
  const activePromos = useMemo(() => (promoList || []).filter((p) => p.active), [promoList]);

  const [selectedPromoId, setSelectedPromoId] = useState("");
  const [promoPhotoDataUrl, setPromoPhotoDataUrl] = useState<string | null>(null);
  const promoFileInputRef = useRef<HTMLInputElement>(null);

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
      total: "",
      notes: "",
    },
  });

  const watchedService = form.watch("service");
  const watchedWeight = form.watch("weight");

  const selectedPromo = useMemo(
    () => activePromos.find((p) => String(p.id) === selectedPromoId),
    [activePromos, selectedPromoId]
  );

  const baseTotal = useMemo(() => {
    const svc = activeServices.find((s) => s.name === watchedService);
    const pricePerKg = svc ? Number(svc.pricePerKg) : 0;
    const kg = parseFloat(watchedWeight);
    if (pricePerKg > 0 && !isNaN(kg) && kg > 0) return pricePerKg * kg;
    return 0;
  }, [watchedService, watchedWeight, activeServices]);

  const discountAmount = selectedPromo ? (baseTotal * Number(selectedPromo.discount)) / 100 : 0;
  const finalTotal = baseTotal - discountAmount;

  useEffect(() => {
    if (baseTotal > 0) {
      form.setValue("total", finalTotal.toFixed(2), { shouldValidate: true });
    } else {
      form.setValue("total", "", { shouldValidate: false });
    }
  }, [baseTotal, finalTotal, form]);

  const handleClose = () => {
    setOpen(false);
    form.reset();
    setSelectedPromoId("");
    setPromoPhotoDataUrl(null);
  };

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

  const onSubmit = (data: FormValues) => {
    const orderId = `ORD${Math.floor(1000 + Math.random() * 9000)}`;

    const promoFields = selectedPromo
      ? {
          promoId: selectedPromo.id,
          promoName: selectedPromo.name,
          promoClaimName: selectedPromo.name,
          discountAmount: discountAmount.toFixed(2),
          promoPhoto: promoPhotoDataUrl ?? undefined,
          promoClaimStatus: "approved",
        }
      : {};

    createOrder(
      { ...data, total: finalTotal > 0 ? finalTotal.toFixed(2) : data.total, orderId, status: "pending", ...promoFields },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Order created successfully." });
          handleClose();
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const selectedPricePerKg = activeServices.find((s) => s.name === watchedService)?.pricePerKg;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:-translate-y-0.5 px-6">
          <PlusCircle className="w-5 h-5 mr-2" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto rounded-3xl border-border/50 sleek-shadow bg-card/95 backdrop-blur-xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display text-2xl">Create New Order</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the customer and service details to register a new laundry order.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan dela Cruz" className="rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all" data-testid="input-customer-name" {...field} />
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
                    <FormLabel className="text-foreground/80">Contact Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="09171234567"
                        className="rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all"
                        inputMode="tel"
                        maxLength={13}
                        data-testid="input-contact-number"
                        {...field}
                        onChange={(e) => {
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
                    <FormLabel className="text-foreground/80">Gmail Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="yourname@gmail.com"
                        className="rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all"
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
                    <FormLabel className="text-foreground/80">Full Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Rizal St, Barangay, City" className="rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all" {...field} />
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
                    <FormLabel className="text-foreground/80">
                      Special Instructions{" "}
                      <span className="text-muted-foreground font-normal">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <textarea
                        placeholder=" No fabric softener, handle delicates gently, separate whites..."
                        rows={3}
                        className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none transition-all"
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
                    <FormLabel className="text-foreground/80">Service Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl bg-background/50 border-border/50" data-testid="select-service">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-border/50">
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
                        min="0.1"
                        placeholder="e.g. 3.5"
                        className="rounded-xl"
                        data-testid="input-weight"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">
                      Total (₱)
                      {selectedPricePerKg && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          ₱{selectedPricePerKg}/kg
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Auto-computed"
                        className="rounded-xl bg-muted/40 border-border/50 text-foreground font-medium cursor-not-allowed"
                        readOnly
                        data-testid="input-total"
                        {...field}
                      />
                    </FormControl>
                    {selectedPromo && discountAmount > 0 && (
                      <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        {selectedPromo.name} applied — ₱{discountAmount.toFixed(2)} off (was ₱{baseTotal.toFixed(2)})
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Promo Section */}
            {activePromos.length > 0 && (
              <div className="border border-border/50 rounded-2xl p-5 space-y-4 bg-background/50">
                <div className="flex items-center gap-2">
                  <BadgePercent className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Apply Promo Discount</h4>
                  <span className="text-xs text-muted-foreground">(Optional)</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {activePromos.map((promo) => (
                    <button
                      key={promo.id}
                      type="button"
                      data-testid={`button-staff-promo-${promo.id}`}
                      onClick={() => {
                        setSelectedPromoId(selectedPromoId === String(promo.id) ? "" : String(promo.id));
                        if (selectedPromoId === String(promo.id)) {
                          setPromoPhotoDataUrl(null);
                        }
                      }}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                        selectedPromoId === String(promo.id)
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border/50 bg-background hover:border-primary/40"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedPromoId === String(promo.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {promo.name} <span className="text-primary">— {Number(promo.discount).toFixed(0)}% off</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{promo.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedPromoId === String(promo.id) ? "border-primary bg-primary" : "border-border"
                      }`}>
                        {selectedPromoId === String(promo.id) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Photo upload — appears when promo is selected */}
                {selectedPromoId && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Proof Photo <span className="text-muted-foreground font-normal">(Optional — for documentation)</span>
                    </p>
                    <input
                      ref={promoFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePromoPhotoChange}
                      data-testid="input-staff-promo-photo"
                    />
                    {promoPhotoDataUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-border">
                        <img src={promoPhotoDataUrl} alt="Promo proof" className="w-full max-h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => { setPromoPhotoDataUrl(null); if (promoFileInputRef.current) promoFileInputRef.current.value = ""; }}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                          data-testid="button-remove-staff-promo-photo"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                          Proof uploaded
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => promoFileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-border rounded-xl py-5 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                        data-testid="button-upload-staff-promo-photo"
                      >
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-xs">Tap to upload proof photo (max 3MB)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
              <Button type="button" variant="ghost" className="rounded-xl" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl px-8" disabled={isPending} data-testid="button-create-order">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Order
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
