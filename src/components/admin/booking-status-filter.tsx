"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { type BookingStatus } from "@/db/schema";

const statuses: (BookingStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
];

export function BookingStatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "ALL";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL" || value === "") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/admin/bookings?${params.toString()}`);
  }

  return (
    <Select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="w-44"
      aria-label="Filter by status"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {s === "ALL" ? "All statuses" : s.charAt(0) + s.slice(1).toLowerCase()}
        </option>
      ))}
    </Select>
  );
}
