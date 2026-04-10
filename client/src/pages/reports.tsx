import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Order, type OrderLog } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart3, History, TrendingUp, Package, DollarSign, Weight, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

const STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  pending: "Accepted",
  received: "Received",
  washing: "Washing",
  drying: "Drying",
  folding: "Folding",
  ready_for_pickup: "Ready for Pickup",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-purple-100 text-purple-700 border-purple-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  received: "bg-cyan-100 text-cyan-700 border-cyan-200",
  washing: "bg-blue-100 text-blue-700 border-blue-200",
  drying: "bg-sky-100 text-sky-700 border-sky-200",
  folding: "bg-violet-100 text-violet-700 border-violet-200",
  ready_for_pickup: "bg-indigo-100 text-indigo-700 border-indigo-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  created: { label: "Created", color: "bg-green-100 text-green-700 border-green-200" },
  status_changed: { label: "Status Changed", color: "bg-blue-100 text-blue-700 border-blue-200" },
  edited: { label: "Edited", color: "bg-sky-100 text-sky-700 border-sky-200" },
  paid: { label: "Marked Paid", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  unpaid: { label: "Marked Unpaid", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  discount_applied: { label: "Discount Applied", color: "bg-purple-100 text-purple-700 border-purple-200" },
  discount_removed: { label: "Discount Removed", color: "bg-pink-100 text-pink-700 border-pink-200" },
  deleted: { label: "Deleted", color: "bg-orange-100 text-orange-700 border-orange-200" },
  restored: { label: "Restored", color: "bg-teal-100 text-teal-700 border-teal-200" },
  permanently_deleted: { label: "Permanently Deleted", color: "bg-red-100 text-red-700 border-red-200" },
};

function formatDate(date: string | Date) {
  return new Date(date).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: string | number) {
  return `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function exportToExcel(orders: Order[], from: string, to: string) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to + "T23:59:59") : null;

  const filtered = orders.filter((o) => {
    if (o.status !== "completed" || o.deletedAt) return false;
    const d = new Date(o.createdAt);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });

  const rows = filtered.map((o) => ({
    "Order ID": o.orderId,
    "Customer Name": o.customerName,
    "Contact": o.contactNumber,
    "Email": o.email,
    "Address": o.address,
    "Service": o.service,
    "Est. Weight (kg)": Number(o.weight),
    "Actual Weight (kg)": o.actualWeight ? Number(o.actualWeight) : "",
    "Promo": o.promoName || "",
    "Discount (₱)": o.discountAmount ? Number(o.discountAmount) : 0,
    "Total (₱)": Number(o.total),
    "Paid": o.paid ? "Yes" : "No",
    "Date": new Date(o.createdAt).toLocaleDateString("en-PH"),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Completed Orders");
  const label = from && to ? `${from}_to_${to}` : from ? `from_${from}` : to ? `to_${to}` : "all";
  XLSX.writeFile(wb, `completed_orders_${label}.xlsx`);
}

export function Reports() {
  const [tab, setTab] = useState<"history" | "analytics">("history");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  const { data: allOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/all"],
  });

  const { data: allLogs, isLoading: logsLoading } = useQuery<OrderLog[]>({
    queryKey: ["/api/orders/logs"],
  });

  const orders = allOrders || [];
  const logs = allLogs || [];
  const isLoading = ordersLoading || logsLoading;

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchesSearch =
        search === "" ||
        l.orderId.toLowerCase().includes(search.toLowerCase()) ||
        l.customerName.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        l.contactNumber.includes(search);
      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      const matchesAction = actionFilter === "all" || l.action === actionFilter;
      return matchesSearch && matchesStatus && matchesAction;
    });
  }, [logs, search, statusFilter, actionFilter]);

  const analytics = useMemo(() => {
    const completed = orders.filter((o) => o.status === "completed" && !o.deletedAt);
    const totalRevenue = completed.reduce((sum, o) => sum + Number(o.total), 0);
    const totalWeight = orders.filter((o) => !o.deletedAt).reduce((sum, o) => sum + Number(o.weight), 0);

    const byStatus: Record<string, number> = {};
    const byService: Record<string, number> = {};
    const revenueByService: Record<string, number> = {};

    for (const o of orders.filter((o) => !o.deletedAt)) {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      byService[o.service] = (byService[o.service] || 0) + 1;
      if (o.status === "completed") {
        revenueByService[o.service] = (revenueByService[o.service] || 0) + Number(o.total);
      }
    }

    const byMonth: Record<string, { count: number; revenue: number }> = {};
    for (const o of orders) {
      const month = new Date(o.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short" });
      if (!byMonth[month]) byMonth[month] = { count: 0, revenue: 0 };
      byMonth[month].count += 1;
      if (o.status === "completed") byMonth[month].revenue += Number(o.total);
    }

    const deletedCount = orders.filter((o) => !!o.deletedAt).length;

    return { totalRevenue, totalWeight, byStatus, byService, revenueByService, byMonth, deletedCount, completedCount: completed.length };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  const maxMonthCount = Math.max(...Object.values(analytics.byMonth).map((m) => m.count), 1);
  const maxMonthRevenue = Math.max(...Object.values(analytics.byMonth).map((m) => m.revenue), 1);
  const months = Object.entries(analytics.byMonth).slice(-6);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-1">Full transaction history and shop analytics.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50">
        <button
          data-testid="tab-history"
          onClick={() => setTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="w-4 h-4" />
          Transaction History
        </button>
        <button
          data-testid="tab-analytics"
          onClick={() => setTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "analytics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
      </div>

      {tab === "history" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              data-testid="input-search"
              type="text"
              placeholder="Search by Order ID, name, email, or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <select
              data-testid="select-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select
              data-testid="select-action"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-muted-foreground px-1">
            Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> total audit entries — includes permanently deleted orders.
          </p>

          {/* Table */}
          <div className="bg-card border border-border/50 rounded-3xl overflow-hidden sleek-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Order ID</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Customer</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground hidden md:table-cell">Service</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground hidden sm:table-cell">Weight</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground hidden sm:table-cell">Total</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Action</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground hidden md:table-cell">Staff</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground hidden lg:table-cell">Logged At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">No records found.</td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: "bg-gray-100 text-gray-700 border-gray-200" };
                      return (
                        <tr
                          key={log.id}
                          data-testid={`row-log-${log.id}`}
                          className={`border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors ${log.action === "permanently_deleted" ? "opacity-60" : ""}`}
                        >
                          <td className="px-5 py-4 font-mono font-semibold text-primary">{log.orderId}</td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-foreground">{log.customerName}</p>
                            <p className="text-xs text-muted-foreground">{log.contactNumber}</p>
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell text-muted-foreground">{log.service}</td>
                          <td className="px-5 py-4 hidden sm:table-cell text-muted-foreground">{log.weight} kg</td>
                          <td className="px-5 py-4 hidden sm:table-cell font-medium">{formatCurrency(log.total)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[log.status] || "bg-gray-100 text-gray-700"}`}>
                              {STATUS_LABELS[log.status] || log.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${actionInfo.color}`}>
                              {actionInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            {log.staffName ? (
                              <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-full">{log.staffName}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 hidden lg:table-cell text-xs text-muted-foreground">{formatDate(log.loggedAt)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="space-y-8">
          {/* Excel Export */}
          <div className="bg-card border border-border/50 rounded-3xl p-5 sleek-shadow">
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Export Completed Orders</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">From</label>
                <input
                  data-testid="input-export-from"
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">To</label>
                <input
                  data-testid="input-export-to"
                  type="date"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Button
                data-testid="button-export-excel"
                className="rounded-xl gap-2 shrink-0"
                onClick={() => exportToExcel(orders, exportFrom, exportTo)}
                disabled={orders.filter((o) => o.status === "completed" && !o.deletedAt).length === 0}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export to Excel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Leave dates empty to export all completed orders. Only completed, non-deleted orders are included.
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border/50 rounded-3xl p-5 sleek-shadow" data-testid="stat-total-revenue">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{formatCurrency(analytics.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">From {analytics.completedCount} completed orders</p>
            </div>

            <div className="bg-card border border-border/50 rounded-3xl p-5 sleek-shadow" data-testid="stat-total-orders">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{orders.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{analytics.deletedCount} deleted</p>
            </div>

            <div className="bg-card border border-border/50 rounded-3xl p-5 sleek-shadow" data-testid="stat-total-weight">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Weight className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total Weight</p>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{analytics.totalWeight.toFixed(2)} kg</p>
              <p className="text-xs text-muted-foreground mt-1">Across active orders</p>
            </div>

            <div className="bg-card border border-border/50 rounded-3xl p-5 sleek-shadow" data-testid="stat-completion-rate">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">
                {orders.length > 0 ? Math.round((analytics.completedCount / orders.filter((o) => !o.deletedAt).length) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Of active orders completed</p>
            </div>
          </div>

          {/* Monthly Orders Chart */}
          {months.length > 0 && (
            <div className="bg-card border border-border/50 rounded-3xl p-6 sleek-shadow">
              <h2 className="font-display text-lg font-bold text-foreground mb-6">Monthly Orders (Last 6 Months)</h2>
              <div className="flex items-end gap-4 h-40">
                {months.map(([month, data]) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-2">
                    <p className="text-xs font-medium text-foreground">{data.count}</p>
                    <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                      <div
                        className="w-full bg-primary/80 rounded-t-lg transition-all duration-500"
                        style={{ height: `${Math.max((data.count / maxMonthCount) * 100, 4)}px` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center leading-tight">{month}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orders by Status */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 sleek-shadow">
              <h2 className="font-display text-lg font-bold text-foreground mb-5">Orders by Status</h2>
              <div className="space-y-3">
                {Object.entries(analytics.byStatus).map(([status, count]) => {
                  const total = Object.values(analytics.byStatus).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}`}>
                          {STATUS_LABELS[status] || status}
                        </span>
                        <span className="text-sm font-semibold text-foreground">{count} <span className="text-muted-foreground font-normal text-xs">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Orders by Service */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 sleek-shadow">
              <h2 className="font-display text-lg font-bold text-foreground mb-5">Orders by Service</h2>
              <div className="space-y-4">
                {Object.entries(analytics.byService).map(([service, count]) => {
                  const total = Object.values(analytics.byService).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={service}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-foreground">{service}</span>
                        <span className="text-sm font-semibold text-foreground">{count} <span className="text-muted-foreground font-normal text-xs">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      {analytics.revenueByService[service] !== undefined && (
                        <p className="text-xs text-muted-foreground mt-0.5">Revenue: {formatCurrency(analytics.revenueByService[service])}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          {months.length > 0 && (
            <div className="bg-card border border-border/50 rounded-3xl p-6 sleek-shadow">
              <h2 className="font-display text-lg font-bold text-foreground mb-6">Monthly Revenue (Last 6 Months)</h2>
              <div className="flex items-end gap-4 h-40">
                {months.map(([month, data]) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-2">
                    <p className="text-xs font-medium text-foreground">{data.revenue > 0 ? `₱${data.revenue.toLocaleString()}` : "₱0"}</p>
                    <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                      <div
                        className="w-full bg-green-500/80 rounded-t-lg transition-all duration-500"
                        style={{ height: `${Math.max((data.revenue / maxMonthRevenue) * 100, data.revenue > 0 ? 4 : 0)}px` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center leading-tight">{month}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
