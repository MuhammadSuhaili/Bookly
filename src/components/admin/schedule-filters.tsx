"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type ServiceOption = { id: string; name: string };

export function ScheduleFilters({ services }: { services: ServiceOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/admin/schedules?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={serviceId}
        onChange={(e) => update("serviceId", e.target.value)}
        className="w-52"
        aria-label="Filter by service"
      >
        <option value="">All services</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Input
        type="date"
        value={from}
        onChange={(e) => update("from", e.target.value)}
        className="w-40"
        aria-label="From date"
      />
      <Input
        type="date"
        value={to}
        onChange={(e) => update("to", e.target.value)}
        className="w-40"
        aria-label="To date"
      />
    </div>
  );
}
