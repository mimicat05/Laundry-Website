import { useState } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  address: z.string().min(5, "Address is required"),
  contactNumber: z.string().min(5, "Contact number is required"),
  email: z.string().email("Invalid email address"),
  service: z.string().min(1, "Please select a service"),
});

type FormValues = z.infer<typeof formSchema>;

export function CustomerOrder() {
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      address: "",
      contactNumber: "",
      email: "",
      service: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsPending(true);
    try {
      const res = await fetch("/api/orders/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
                        <Input placeholder="09XX XXX XXXX" className="rounded-xl" {...field} />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="juan@example.com" className="rounded-xl" {...field} />
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
                          <SelectItem value="Wash & Hang">Wash &amp; Hang — ₱30/kg</SelectItem>
                          <SelectItem value="Dry-cleaning">Dry-cleaning — ₱60/kg</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-4">
                  By submitting, you'll receive a confirmation email once our staff accepts your order. Weight and pricing will be determined upon drop-off.
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
