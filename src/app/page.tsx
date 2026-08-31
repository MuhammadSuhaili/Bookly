import { Suspense } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/icons";
import { ServiceCardItem } from "@/components/service/service-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCategories,
  getFeaturedServices,
  getPopularServices,
} from "@/lib/services";

export const metadata = {
  title: "Home",
};

async function CategoriesSection() {
  const categories = await getCategories();
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h2 className="text-2xl font-bold text-slate-900">Browse by category</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/services?category=${cat.slug}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 text-center transition-shadow hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
              <Icon name={(cat.icon as IconName) ?? "category"} size={24} />
            </span>
            <span className="text-sm font-semibold text-slate-800">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CategoriesSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <Skeleton className="h-8 w-56" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </section>
  );
}

async function FeaturedSection() {
  const featured = await getFeaturedServices();
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Featured services</h2>
          <Link
            href="/services"
            className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            View all <Icon name="arrowRight" size={15} />
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <ServiceCardItem key={s.id} service={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

async function PopularSection() {
  const popular = await getPopularServices();
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h2 className="text-2xl font-bold text-slate-900">Most popular</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {popular.map((s) => (
          <ServiceCardItem key={s.id} service={s} />
        ))}
      </div>
    </section>
  );
}

function ServicesSkeleton() {
  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-72" />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-800 text-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-teal-100">
                  Booking, made simple
                </p>
                <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
                  Discover services and book in seconds
                </h1>
                <p className="mt-4 text-lg text-teal-100">
                  From wellness to home services, find trusted professionals and
                  reserve your spot online.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/services">
                    <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50">
                      Browse services
                      <Icon name="arrowRight" size={18} />
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/40 bg-transparent text-white hover:bg-white/10"
                    >
                      Create account
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=900&q=70&auto=format&fit=crop"
                  alt="Premium spa treatment"
                  className="h-[420px] w-full rounded-2xl object-cover shadow-2xl ring-4 ring-white/20"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <Suspense fallback={<CategoriesSkeleton />}>
          <CategoriesSection />
        </Suspense>

        {/* Featured */}
        <Suspense fallback={<ServicesSkeleton />}>
          <FeaturedSection />
        </Suspense>

        {/* Popular */}
        <Suspense fallback={<ServicesSkeleton />}>
          <PopularSection />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
