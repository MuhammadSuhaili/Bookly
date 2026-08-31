import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc, count } from "drizzle-orm";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/icons";
import { CreateCategoryButton } from "@/components/admin/create-category-button";
import { CategoryActions } from "@/components/admin/category-actions";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      icon: categories.icon,
      isActive: categories.isActive,
      serviceCount: count(services.id),
    })
    .from(categories)
    .leftJoin(services, eq(services.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize your services into categories.
          </p>
        </div>
        <CreateCategoryButton />
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              icon="category"
              title="No categories yet"
              description="Create categories to organize your services."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Slug</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Services</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                            <Icon name={(c.icon as IconName) ?? "category"} size={16} />
                          </span>
                          <span className="font-medium text-slate-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{c.slug}</td>
                      <td className="max-w-xs truncate px-5 py-3 text-slate-500">{c.description ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-600">{c.serviceCount}</td>
                      <td className="px-5 py-3">
                        {c.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <CategoryActions category={c} />
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
