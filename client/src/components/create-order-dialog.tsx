import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { useCreateOrder } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
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

// Form schema with coercion for numeric fields since HTML inputs return strings
const formSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  address: z.string().min(5, "Address is required"),
  contactNumber: z.string().min(5, "Contact number is required"),
  email: z.string().email("Invalid email"),
  service: z.string().min(1, "Please select a service"),
  weight: z.string().min(1, "Weight is required"),
  total: z.string().min(1, "Total is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateOrderDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      address: "",
      contactNumber: "",
      email: "",
      service: "",
      weight: "",
      total: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    // Generate a simple Order ID
    const orderId = `ORD${Math.floor(1000 + Math.random() * 9000)}`;
    
    createOrder(
      {
        ...data,
        orderId,
        status: "pending",
      },
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:-translate-y-0.5 px-6">
          <PlusCircle className="w-5 h-5 mr-2" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-3xl border-border/50 sleek-shadow bg-card/95 backdrop-blur-xl">
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
                      <Input placeholder="John Doe" className="rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all" {...field} />
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
                      <Input placeholder="+1 234 567 890" className="rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all" {...field} />
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
                    <FormLabel className="text-foreground/80">Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" className="rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all" {...field} />
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
                      <Input placeholder="123 Main St, City" className="rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl bg-background/50 border-border/50">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-border/50">
                        <SelectItem value="Wash & Hang">Wash & Hang</SelectItem>
                        <SelectItem value="Wash & Fold">Wash & Fold</SelectItem>
                        <SelectItem value="Dry Cleaning">Dry Cleaning</SelectItem>
                        <SelectItem value="Ironing Only">Ironing Only</SelectItem>
                        <SelectItem value="Premium Care">Premium Care</SelectItem>
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
                    <FormLabel className="text-foreground/80">Weight (KG)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="5.5" className="rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all" {...field} />
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
                    <FormLabel className="text-foreground/80">Total Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="25.00" className="rounded-xl bg-background/50 border-border/50 focus:bg-background transition-all" {...field} />
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
