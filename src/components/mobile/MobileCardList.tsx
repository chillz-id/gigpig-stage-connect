import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface MobileCardField<T> {
  label?: string;
  value: (item: T) => React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export interface MobileCardListProps<T> {
  data: T[];
  /** Primary field (title) */
  title: (item: T) => React.ReactNode;
  /** Secondary field (subtitle) */
  subtitle?: (item: T) => React.ReactNode;
  /** Badge/tag rendering */
  badges?: (item: T) => React.ReactNode;
  /** Card fields to display */
  fields?: MobileCardField<T>[];
  /** Actions (buttons, etc.) */
  actions?: (item: T) => React.ReactNode;
  /** Click handler */
  onClick?: (item: T) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Empty message */
  emptyMessage?: string;
  /** Custom className */
  className?: string;
}

/**
 * Mobile-optimized card list component
 *
 * Displays data in vertical cards instead of tables on mobile.
 * Follows CustomerCard pattern for consistency.
 *
 * @example
 * ```tsx
 * <MobileCardList
 *   data={events}
 *   title={(event) => event.name}
 *   subtitle={(event) => formatDate(event.date)}
 *   badges={(event) => (
 *     <Badge>{event.status}</Badge>
 *   )}
 *   fields={[
 *     {
 *       icon: MapPin,
 *       value: (event) => event.venue_name
 *     }
 *   ]}
 *   onClick={(event) => navigate(`/events/${event.id}`)}
 * />
 * ```
 */
export function MobileCardList<T extends { id: string }>({
  data,
  title,
  subtitle,
  badges,
  fields = [],
  actions,
  onClick,
  isLoading = false,
  emptyMessage = "No data found",
  className = "",
}: MobileCardListProps<T>) {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`py-12 text-center text-muted-foreground ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {data.map((item) => (
        <Card
          key={item.id}
          className={onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""}
          onClick={() => onClick?.(item)}
        >
          <CardHeader className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold">{title(item)}</h3>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">
                    {subtitle(item)}
                  </p>
                )}
              </div>
            </div>
            {badges && (
              <div className="flex flex-wrap gap-2">
                {badges(item)}
              </div>
            )}
          </CardHeader>

          {(fields.length > 0 || actions) && (
            <CardContent className="space-y-3">
              {fields.map((field, index) => {
                const Icon = field.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-sm ${field.className || "text-muted-foreground"}`}
                  >
                    {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      {field.label && (
                        <span className="mr-1 font-medium text-foreground">
                          {field.label}:
                        </span>
                      )}
                      <span>{field.value(item)}</span>
                    </div>
                  </div>
                );
              })}

              {actions && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {actions(item)}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
