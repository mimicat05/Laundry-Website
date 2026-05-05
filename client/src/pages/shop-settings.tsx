import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Settings as SettingsIcon } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ShopSettings } from "@shared/schema";

const settingsSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine((val) => {
      const cleaned = val.replace(/[\s\-().]/g, "");
      return (
        /^(\+639|09)\d{9}$/.test(cleaned) ||
        /^0\d{9,10}$/.test(cleaned)
      );
    }, "Enter a valid Philippine phone number (e.g. 09XX XXX XXXX or 0XX XXXX XXXX)"),
  email: z.string().email("Enter a valid email address").max(120),
  address: z.string().min(5, "Address is required").max(250),
  hours: z.string().min(1, "Business hours are required").max(250),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export function ShopSettingsPage() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<ShopSettings>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { phone: "", email: "", address: "", hours: "" },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        hours: settings.hours,
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (data: SettingsForm) => apiRequest("PUT", "/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Saved", description: "Shop information updated." });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to save shop settings",
        variant: "destructive",
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Shop Settings</h1>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-3xl p-6 sleek-shadow max-w-2xl">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="09XX XXX XXXX or 0XX XXXX XXXX"
                        className="rounded-xl"
                        data-testid="input-settings-phone"
                        maxLength={16}
                        {...field}
                        onChange={(e) => {
                          const filtered = e.target.value.replace(/[^\d\s\-+().]/g, "");
                          field.onChange(filtered);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Philippine mobile (09XX XXX XXXX) or landline (0XX XXXX XXXX). Customers can tap this to call you.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="hello@yourshop.com"
                        className="rounded-xl"
                        data-testid="input-settings-email"
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
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Street, City, Country"
                        className="rounded-xl"
                        data-testid="input-settings-address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Hours</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Mon–Sat: 7am – 8pm  |  Sun: 9am – 5pm"
                        className="rounded-xl"
                        data-testid="input-settings-hours"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  className="rounded-xl px-6"
                  disabled={mutation.isPending}
                  data-testid="button-save-settings"
                >
                  {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
