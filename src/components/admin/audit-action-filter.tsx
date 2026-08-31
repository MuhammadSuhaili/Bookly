"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

export function AuditActionFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("action") ?? "ALL";

  const actions = [
    "LOGIN",
    "CATEGORY_CREATE",
    "CATEGORY_UPDATE",
    "CATEGORY_DELETE",
    "SERVICE_CREATE",
    "SERVICE_UPDATE",
    "SERVICE_DELETE",
    "SERVICE_TOGGLE",
    "SCHEDULE_CREATE",
    "SCHEDULE_DELETE",
    "TIMESLOT_CREATE",
    "TIMESLOT_DELETE",
    "BOOKING_STATUS_CHANGE",
    "SEED",
  ];

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL" || value === "") {
      params.delete("action");
    } else {
      params.set("action", value);
    }
    router.push(`/admin/audit?${params.toString()}`);
  }

  return (
    <Select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="w-56"
      aria-label="Filter by action"
    >
      <option value="ALL">All actions</option>
      {actions.map((a) => (
        <option key={a} value={a}>
          {a}
        </option>
      ))}
    </Select>
  );
}
