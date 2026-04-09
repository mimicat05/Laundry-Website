import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type Service, type Promo, insertServiceSchema, insertPromoSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, Plus, Shirt, Tag, ToggleLeft } from "lucide-react";

const serviceFormSchema = insertServiceSchema.extend({
  pricePerKg: z.coerce.number().positive("Price must be greater than 0"),
});
const promoFormSchema = insertPromoSchema.extend({
  discount: z.coerce.number().min(1, "Discount must be at least 1%").max(100, "Discount can't exceed 100%"),
});

type ServiceForm = z.infer<typeof serviceFormSchema>;
type PromoForm = z.infer<typeof promoFormSchema>;

function ConfirmDeleteDialog({ open, onOpenChange, onConfirm, name }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  name: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-3xl border-border/50 bg-card/95 backdrop-blur-xl p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Delete "{name}"?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-1">This cannot be undone.</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" className="rounded-xl" onClick={onConfirm}>Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ServiceDialog({ open, onOpenChange, service }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  service?: Service;
}) {
  const { toast } = useToast();
  const isEdit = !!service;

  const form = useForm<ServiceForm>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name ?? "",
      description: service?.description ?? "",
      pricePerKg: service ? Number(service.pricePerKg) : 0,
      active: service?.active ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ServiceForm) => {
      if (isEdit) return apiRequest("PUT", `/api/services/${service.id}`, data);
      return apiRequest("POST", "/api/services", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: isEdit ? "Service updated" : "Service created" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => toast({ title: "Error", description: "Failed to save service", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-border/50 bg-card/95 backdrop-blur-xl p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{isEdit ? "Edit Service" : "Add Service"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4 mt-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Service Name</FormLabel>
                <FormControl><Input className="rounded-xl" placeholder="e.g. Wash & Hang" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" rows={2} placeholder="Brief description of the service" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="pricePerKg" render={({ field }) => (
              <FormItem>
                <FormLabel>Price per kg (₱)</FormLabel>
                <FormControl><Input type="number" step="0.01" min="0" className="rounded-xl" placeholder="e.g. 30" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="active" render={({ field }) => (
              <FormItem className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="cursor-pointer font-normal">Active (visible to customers)</FormLabel>
              </FormItem>
            )} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="rounded-xl px-6" disabled={mutation.isPending}>
                {isEdit ? "Save Changes" : "Add Service"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PromoDialog({ open, onOpenChange, promo }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  promo?: Promo;
}) {
  const { toast } = useToast();
  const isEdit = !!promo;

  const form = useForm<PromoForm>({
    resolver: zodResolver(promoFormSchema),
    defaultValues: {
      name: promo?.name ?? "",
      description: promo?.description ?? "",
      discount: promo ? Number(promo.discount) : 10,
      active: promo?.active ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: PromoForm) => {
      if (isEdit) return apiRequest("PUT", `/api/promos/${promo.id}`, data);
      return apiRequest("POST", "/api/promos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promos"] });
      toast({ title: isEdit ? "Promo updated" : "Promo created" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => toast({ title: "Error", description: "Failed to save promo", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-border/50 bg-card/95 backdrop-blur-xl p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{isEdit ? "Edit Promo" : "Add Promo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4 mt-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Promo Name</FormLabel>
                <FormControl><Input className="rounded-xl" placeholder="e.g. Senior Citizen Discount" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" rows={2} placeholder="Who qualifies, how to avail, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="discount" render={({ field }) => (
              <FormItem>
                <FormLabel>Discount (%)</FormLabel>
                <FormControl><Input type="number" step="1" min="1" max="100" className="rounded-xl" placeholder="e.g. 20" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="active" render={({ field }) => (
              <FormItem className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="cursor-pointer font-normal">Active (visible to customers)</FormLabel>
              </FormItem>
            )} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="rounded-xl px-6" disabled={mutation.isPending}>
                {isEdit ? "Save Changes" : "Add Promo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ManageServices() {
  const { toast } = useToast();
  const [serviceDialog, setServiceDialog] = useState<{ open: boolean; service?: Service }>({ open: false });
  const [promoDialog, setPromoDialog] = useState<{ open: boolean; promo?: Promo }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "service" | "promo"; id: number; name: string } | null>(null);

  const { data: serviceList, isLoading: svcLoading } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: promoList, isLoading: promoLoading } = useQuery<Promo[]>({ queryKey: ["/api/promos"] });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service deleted" });
      setDeleteConfirm(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to delete service", variant: "destructive" }),
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/promos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promos"] });
      toast({ title: "Promo deleted" });
      setDeleteConfirm(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to delete promo", variant: "destructive" }),
  });

  const toggleServiceMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => apiRequest("PUT", `/api/services/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/services"] }),
  });

  const togglePromoMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => apiRequest("PUT", `/api/promos/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/promos"] }),
  });

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "service") deleteServiceMutation.mutate(deleteConfirm.id);
    else deletePromoMutation.mutate(deleteConfirm.id);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Manage Services</h1>
        <p className="text-muted-foreground mt-1">Add, edit, or remove the services and promos offered to customers.</p>
      </div>

      {/* Services Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shirt className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-bold text-foreground">Services</h2>
          </div>
          <Button data-testid="button-add-service" className="rounded-xl gap-2" onClick={() => setServiceDialog({ open: true })}>
            <Plus className="w-4 h-4" />Add Service
          </Button>
        </div>

        {svcLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}</div>
        ) : serviceList?.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-3xl p-10 text-center text-muted-foreground">
            No services yet. Add your first one.
          </div>
        ) : (
          <div className="space-y-3">
            {serviceList?.map((svc) => (
              <div key={svc.id} data-testid={`card-service-${svc.id}`} className={`bg-card border rounded-3xl p-5 sleek-shadow flex items-start justify-between gap-4 transition-opacity ${svc.active ? "border-border/50" : "border-border/20 opacity-60"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{svc.name}</h3>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-lg">₱{Number(svc.pricePerKg).toFixed(2)}/kg</span>
                    {!svc.active && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">Inactive</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{svc.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    data-testid={`toggle-service-${svc.id}`}
                    title={svc.active ? "Deactivate" : "Activate"}
                    onClick={() => toggleServiceMutation.mutate({ id: svc.id, active: !svc.active })}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ToggleLeft className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`edit-service-${svc.id}`}
                    onClick={() => setServiceDialog({ open: true, service: svc })}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`delete-service-${svc.id}`}
                    onClick={() => setDeleteConfirm({ type: "service", id: svc.id, name: svc.name })}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Promos Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-bold text-foreground">Promos & Discounts</h2>
          </div>
          <Button data-testid="button-add-promo" className="rounded-xl gap-2" onClick={() => setPromoDialog({ open: true })}>
            <Plus className="w-4 h-4" />Add Promo
          </Button>
        </div>

        {promoLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}</div>
        ) : promoList?.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-3xl p-10 text-center text-muted-foreground">
            No promos yet. Add your first one.
          </div>
        ) : (
          <div className="space-y-3">
            {promoList?.map((promo) => (
              <div key={promo.id} data-testid={`card-promo-${promo.id}`} className={`bg-card border rounded-3xl p-5 sleek-shadow flex items-start justify-between gap-4 transition-opacity ${promo.active ? "border-border/50" : "border-border/20 opacity-60"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{promo.name}</h3>
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-lg border border-green-200">{Number(promo.discount).toFixed(0)}% off</span>
                    {!promo.active && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">Inactive</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{promo.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    data-testid={`toggle-promo-${promo.id}`}
                    title={promo.active ? "Deactivate" : "Activate"}
                    onClick={() => togglePromoMutation.mutate({ id: promo.id, active: !promo.active })}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ToggleLeft className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`edit-promo-${promo.id}`}
                    onClick={() => setPromoDialog({ open: true, promo })}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`delete-promo-${promo.id}`}
                    onClick={() => setDeleteConfirm({ type: "promo", id: promo.id, name: promo.name })}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dialogs */}
      <ServiceDialog
        open={serviceDialog.open}
        onOpenChange={(v) => setServiceDialog({ open: v })}
        service={serviceDialog.service}
      />
      <PromoDialog
        open={promoDialog.open}
        onOpenChange={(v) => setPromoDialog({ open: v })}
        promo={promoDialog.promo}
      />
      <ConfirmDeleteDialog
        open={!!deleteConfirm}
        onOpenChange={(v) => !v && setDeleteConfirm(null)}
        onConfirm={handleDelete}
        name={deleteConfirm?.name ?? ""}
      />
    </div>
  );
}
