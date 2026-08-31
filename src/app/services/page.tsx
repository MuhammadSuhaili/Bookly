import { Suspense } from "react";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { CatalogBrowser } from "@/components/service/catalog-browser";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories, getServicesByCategory } from "@/lib/services";

export const metadata = { title: "Services" };

async function Catalog({ category }: { category?: string }) {
  const [categories, services] = await Promise.all([
    getCategories(),
    getServicesByCategory(category),
  ]);
  const active = categories.find((c) => c.slug === category)?.slug;

  return (
    <>
      <p className="mt-1 text-slate-500">
        {active
          ? `Showing services in: ${categories.find((c) => c.slug === active)?.name}`
          : "Browse all available services"}
      </p>
      <Suspense
        fallback={
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        }
      >
        <CatalogBrowser
          services={services}
          categories={categories}
          activeCategory={active}
        />
      </Suspense>
    </>
  );
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Services</h1>
        <Suspense
          fallback={
            <>
              <p className="mt-1 text-slate-500">Memuat layanan&hellip;</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-72" />
                ))}
              </div>
            </>
          }
        >
          <Catalog category={category} />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
