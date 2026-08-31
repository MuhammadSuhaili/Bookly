import { db } from "@/db";
import { services, categories } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateServiceButton } from "@/components/admin/create-service-button";
import { ServiceActions } from "@/components/admin/service-actions";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Services" };

export default async function AdminServicesPage() {
  await requireAdmin();

  const cats = await db.select().from(categories).orderBy(asc(categories.name));
  const rows = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      categoryId: services.categoryId,
      description: services.description,
      shortDescription: services.shortDescription,
      price: services.price,
      durationMinutes: services.durationMinutes,
      location: services.location,
      isOnline: services.isOnline,
      isActive: services.isActive,
      isFeatured: services.isFeatured,
      isPopular: services.isPopular,
    })
    .from(services)
    .orderBy(asc(services.name));

  const catNameById = new Map(cats.map((c) => [c.id, c.name]));
  const categoryOptions = cats.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Services</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the services offered on your platform.
          </p>
        </div>
        <CreateServiceButton categories={categoryOptions} />
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              icon="service"
              title="No services yet"
              description="Create your first service to start accepting bookings."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.slug}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {catNameById.get(s.categoryId) ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-900">{formatCurrency(s.price)}</td>
                      <td className="px-5 py-3 text-slate-600">{s.durationMinutes} min</td>
                      <td className="px-5 py-3">
                        {s.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <ServiceActions service={s} categories={categoryOptions} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
