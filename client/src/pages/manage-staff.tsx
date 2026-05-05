import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type Staff } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, Users, Crown, UserCircle, ShieldAlert } from "lucide-react";

const staffFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d{4}$/, "PIN must be 4 digits"),
  role: z.enum(["owner", "staff"]),
  active: z.boolean(),
});

type StaffForm = z.infer<typeof staffFormSchema>;

export function ManageStaff() {
  const { staffId: currentStaffId } = useAuth();
  const { toast } = useToast();
  const [editTarget, setEditTarget] = useState<Staff | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);

  const { data: staffList, isLoading } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });

  const createForm = useForm<StaffForm>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: { name: "", pin: "", role: "staff", active: true },
  });

  const editForm = useForm<StaffForm>({
    resolver: zodResolver(staffFormSchema),
    values: editTarget ? { name: editTarget.name, pin: editTarget.pin, role: editTarget.role as "owner" | "staff", active: editTarget.active } : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: StaffForm) => apiRequest("POST", "/api/staff", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Staff Created", description: "New staff account has been created." });
      setShowCreate(false);
      createForm.reset({ name: "", pin: "", role: "staff", active: true });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StaffForm> }) =>
      apiRequest("PUT", `/api/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Staff Updated", description: "Staff account has been updated." });
      setEditTarget(null);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Staff Removed", description: "Staff account has been removed." });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const StaffFormFields = ({ form, isPending }: { form: any; isPending: boolean }) => (
    <div className="space-y-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Full Name</FormLabel>
          <FormControl><Input placeholder="e.g. Maria Santos" className="rounded-xl" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="pin" render={({ field }) => (
        <FormItem>
          <FormLabel>4-Digit PIN</FormLabel>
          <FormControl>
            <Input
              type="password"
              placeholder="••••"
              maxLength={4}
              className="rounded-xl tracking-widest text-center text-lg"
              {...field}
              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="role" render={({ field }) => (
        <FormItem>
          <FormLabel>Role</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            </FormControl>
            <SelectContent className="rounded-xl">
              <SelectItem value="staff">Staff — Order management only</SelectItem>
              <SelectItem value="owner">Owner — Full access</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="active" render={({ field }) => (
        <FormItem>
          <FormLabel>Status</FormLabel>
          <Select onValueChange={(v) => field.onChange(v === "true")} value={String(field.value)}>
            <FormControl>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            </FormControl>
            <SelectContent className="rounded-xl">
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Manage Staff</h1>
          
        </div>
        <Button
          data-testid="button-add-staff"
          className="rounded-xl px-5 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Staff
        </Button>
      </div>

      <div className="space-y-3">
        {(staffList || []).length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No staff accounts found.</div>
        )}
        {(staffList || []).map((member) => (
          <div
            key={member.id}
            data-testid={`card-staff-${member.id}`}
            className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4 sleek-shadow"
          >
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {member.role === "owner"
                ? <Crown className="w-5 h-5 text-primary" />
                : <UserCircle className="w-5 h-5 text-primary" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground">{member.name}</p>
                {member.id === currentStaffId && (
                  <Badge variant="outline" className="text-xs rounded-full px-2 py-0 border-primary/30 text-primary">You</Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-xs rounded-full px-2 py-0 capitalize ${member.role === "owner" ? "border-amber-300 text-amber-700 bg-amber-50" : "border-blue-200 text-blue-700 bg-blue-50"}`}
                >
                  {member.role}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs rounded-full px-2 py-0 ${member.active ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-gray-200 text-gray-500 bg-gray-50"}`}
                >
                  {member.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">PIN: ••••</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                data-testid={`button-edit-staff-${member.id}`}
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-primary/10 hover:text-primary"
                onClick={() => setEditTarget(member)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                data-testid={`button-delete-staff-${member.id}`}
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-red-50 hover:text-red-600"
                onClick={() => setDeleteTarget(member)}
                disabled={member.id === currentStaffId}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md rounded-3xl border-border/50 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Add Staff Account
            </DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-5 pt-2">
              <StaffFormFields form={createForm} isPending={createMutation.isPending} />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" className="rounded-xl px-6" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating…" : "Create Account"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-md rounded-3xl border-border/50 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" /> Edit Staff Account
            </DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((d) => updateMutation.mutate({ id: editTarget!.id, data: d }))}
              className="space-y-5 pt-2"
            >
              <StaffFormFields form={editForm} isPending={updateMutation.isPending} />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button type="submit" className="rounded-xl px-6" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm rounded-3xl border-border/50 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" /> Remove Staff Account
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to remove <strong>{deleteTarget?.name}</strong>? They will no longer be able to log in.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              className="rounded-xl px-6"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Removing…" : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
