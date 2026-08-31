import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { BookingForm } from "@/components/booking/booking-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons";
import { formatCurrency } from "@/lib/utils";
import { getServiceBySlug } from "@/lib/services";
import { getCurrentUser } from "@/lib/auth/guards";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  return service ? { title: service.name } : { title: "Service" };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const session = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/services" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 mb-6">
          <Icon name="arrowLeft" size={16} />
          All services
        </Link>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Details */}
          <div className="lg:col-span-3">
            <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-72">
              {service.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={service.imageUrl} alt={service.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300">
                  <Icon name="service" size={56} />
                </div>
              )}
              <div className="absolute right-3 top-3">
                <Badge variant="primary">{formatCurrency(service.price)}</Badge>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>{service.category.name}</span>
                {service.isOnline && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <Icon name="check" size={14} /> Online
                    </span>
                  </>
                )}
                {!service.isOnline && service.location && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="mapPin" size={14} />
                      {service.location}
                    </span>
                  </>
                )}
              </div>

              <h1 className="mt-2 text-2xl font-bold text-slate-900">{service.name}</h1>

              <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Icon name="star" size={16} className="text-amber-400" />
                  {Number(service.rating).toFixed(1)} ({service.ratingCount} reviews)
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="clock" size={16} />
                  {service.durationMinutes} min
                </span>
              </div>

              <div className="mt-6 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                {service.description}
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Book this service</h2>
              {session ? (
                <BookingForm
                  serviceId={service.id}
                  serviceName={service.name}
                  price={formatCurrency(service.price)}
                  user={{ firstName: session.firstName, lastName: session.lastName, email: session.email }}
                />
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 mb-3">Log in to book this service.</p>
                  <Link href={`/login?next=/services/${slug}`}>
                    <Button className="w-full" icon="lock">
                      Log in to book
                    </Button>
                  </Link>
                  <p className="mt-3 text-sm text-slate-500">
                    New here?{" "}
                    <Link href="/register" className="font-medium text-teal-600 hover:text-teal-700">
                      Create an account
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
