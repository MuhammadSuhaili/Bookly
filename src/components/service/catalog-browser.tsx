"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ServiceCardItem } from "@/components/service/service-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import type { ServiceCard } from "@/lib/services";
import type { Category } from "@/db/schema";

export function CatalogBrowser({
  services,
  categories,
  activeCategory,
}: {
  services: ServiceCard[];
  categories: Category[];
  activeCategory?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      const matchesCategory = !activeCategory || s.category.slug === activeCategory;
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.name.toLowerCase().includes(q) ||
        (s.shortDescription ?? "").toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [services, activeCategory, query]);

  function onCategoryChange(value: string) {
    if (value === "all") {
      router.push("/services");
    } else {
      router.push(`/services?category=${value}`);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search services…"
            leadingIcon="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          className="sm:w-56"
          value={activeCategory ?? "all"}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon="search"
            title={searchParams.get("category") ? "No services in this category" : "No services found"}
            description="Try adjusting your search or filter."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <ServiceCardItem key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}
