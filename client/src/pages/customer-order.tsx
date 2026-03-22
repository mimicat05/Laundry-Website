import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Droplets, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
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

const SERVICES: Record<string, number> = {
  "Wash & Hang": 30,
  "Dry-cleaning": 60,
};

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
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

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

  const watchedService = form.watch("service");
  const watchedWeight = form.watch("weight");

  const computedTotal = (() => {
    const pricePerKg = SERVICES[watchedService] ?? 0;
    const kg = parseFloat(watchedWeight);
    if (pricePerKg > 0 && !isNaN(kg) && kg > 0) {
      return (pricePerKg * kg).toFixed(2);
    }
    return null;
  })();

  const onSubmit = async (data: FormValues) => {
    setIsPending(true);
    try {
      const res = await fetch("/api/orders/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          total: computedTotal || "0",
        }),
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
            <Button
              className="rounded-xl w-full"
              onClick={() => { setSubmitted(false); form.reset(); }}
            >
              Place Another Order
            </Button>
            <Link href="/">
              <Button variant="ghost" className="rounded-xl w-full">Back to Home</Button>
            </Link>
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
                        <Input placeholder="Juan dela Cruz" className="rounded-xl" {...field} />
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
                          className="rounded-xl"
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
                      <FormLabel>Gmail Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="yourname@gmail.com"
                          className="rounded-xl"
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
                        <Input placeholder="123 Mabini St, Calaca, Batangas" className="rounded-xl" {...field} />
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
                          <SelectItem value="Wash & Hang">Wash &amp; Hang (₱30/kg)</SelectItem>
                          <SelectItem value="Dry-cleaning">Dry Cleaning (₱60/kg)</SelectItem>
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
