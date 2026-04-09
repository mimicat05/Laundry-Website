import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { useCreateOrder } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
import { type Service } from "@shared/schema";
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
  FormDescription,
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
  const activeServices = (serviceList || []).filter((s) => s.active);

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

  useEffect(() => {
    const svc = activeServices.find((s) => s.name === watchedService);
    const pricePerKg = svc ? Number(svc.pricePerKg) : 0;
    const kg = parseFloat(watchedWeight);
    if (pricePerKg > 0 && !isNaN(kg) && kg > 0) {
      form.setValue("total", (pricePerKg * kg).toFixed(2), { shouldValidate: true });
    } else {
      form.setValue("total", "", { shouldValidate: false });
    }
  }, [watchedService, watchedWeight, form, activeServices]);

  const onSubmit = (data: FormValues) => {
    const orderId = `ORD${Math.floor(1000 + Math.random() * 9000)}`;
    createOrder(
      { ...data, orderId, status: "pending" },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Order created successfully." });
          setOpen(false);
          form.reset();
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const selectedPricePerKg = activeServices.find((s) => s.name === watchedService)?.pricePerKg;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:-translate-y-0.5 px-6">
          <PlusCircle className="w-5 h-5 mr-2" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto rounded-3xl border-border/50 sleek-shadow bg-card/95 backdrop-blur-xl p-6">
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
                      <Input placeholder="Juan dela Cruz" className="rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all" {...field} />
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
                        <SelectTrigger className="rounded-xl bg-background/50 border-border/50">
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
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
              <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl px-8" disabled={isPending}>
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
