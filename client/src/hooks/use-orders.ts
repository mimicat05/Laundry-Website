import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type OrderInput, type OrderUpdateInput } from "@shared/routes";

// GET /api/orders
export function useOrders() {
  return useQuery({
    queryKey: [api.orders.list.path],
    queryFn: async () => {
      const res = await fetch(api.orders.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      return api.orders.list.responses[200].parse(data);
    },
  });
}

// GET /api/orders/:id
export function useOrder(id: number) {
  return useQuery({
    queryKey: [api.orders.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.orders.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch order");
      const data = await res.json();
      return api.orders.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}

// POST /api/orders
export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: OrderInput) => {
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to create order" }));
        throw new Error(error.message || "Failed to create order");
      }
      return api.orders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
    },
  });
}

// PUT /api/orders/:id
export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & OrderUpdateInput) => {
      const url = buildUrl(api.orders.update.path, { id });
      const res = await fetch(url, {
        method: api.orders.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to update order" }));
        throw new Error(error.message || "Failed to update order");
      }
      return api.orders.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.orders.get.path, variables.id] });
    },
  });
}

// DELETE /api/orders/:id
export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.orders.delete.path, { id });
      const res = await fetch(url, {
        method: api.orders.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
    },
  });
}

// POST /api/orders/:id/restore
export function useRestoreOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.orders.restore.path, { id });
      const res = await fetch(url, {
        method: api.orders.restore.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to restore order");
      const data = await res.json();
      return api.orders.restore.responses[200].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.orders.listDeleted.path] });
    },
  });
}

// DELETE /api/orders/:id/permanent
export function usePermanentDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/orders/${id}/permanent`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to permanently delete order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.listDeleted.path] });
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
    },
  });
}

// GET /api/orders/deleted
export function useDeletedOrders() {
  return useQuery({
    queryKey: [api.orders.listDeleted.path],
    queryFn: async () => {
      const res = await fetch(api.orders.listDeleted.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch deleted orders");
      const data = await res.json();
      return api.orders.listDeleted.responses[200].parse(data);
    },
  });
}
