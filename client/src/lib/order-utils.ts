export const STATUS_LABELS: Record<string, string> = {
  requested:        "New Request",
  pending:          "Accepted",
  received:         "Received",
  washing:          "Washing",
  drying:           "Drying",
  folding:          "Folding",
  ready_for_pickup: "Ready for Pickup",
  completed:        "Completed",
  cancelled:        "Cancelled",
};

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}
