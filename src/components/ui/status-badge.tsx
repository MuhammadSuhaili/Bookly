import { Badge } from "./badge";
import { type BookingStatus } from "@/db/schema";

const statusMap: Record<BookingStatus, { label: string; variant: "neutral" | "success" | "warning" | "danger" | "info" | "primary" }> = {
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "info" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
  REJECTED: { label: "Rejected", variant: "danger" },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, variant } = statusMap[status] ?? { label: status, variant: "neutral" as const };
  return <Badge variant={variant}>{label}</Badge>;
}
