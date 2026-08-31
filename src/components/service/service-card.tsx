import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons";
import { formatCurrency } from "@/lib/utils";
import type { ServiceCard as ServiceCardType } from "@/lib/services";

export function ServiceCardItem({ service }: { service: ServiceCardType }) {
  return (
    <Link href={`/services/${service.slug}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative h-40 w-full overflow-hidden bg-slate-100">
          {service.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={service.imageUrl}
              alt={service.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              <Icon name="service" size={40} />
            </div>
          )}
          <div className="absolute right-2 top-2">
            <Badge variant="primary">{formatCurrency(service.price)}</Badge>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{service.category.name}</span>
            {service.isOnline && <span>·</span>}
            {service.isOnline && <span>Online</span>}
          </div>
          <h3 className="mt-1 font-semibold text-slate-900">{service.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {service.shortDescription ?? service.description}
          </p>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" size={15} />
              {service.durationMinutes} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="star" size={15} className="text-amber-400" />
              {Number(service.rating).toFixed(1)} ({service.ratingCount})
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
