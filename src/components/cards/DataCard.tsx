import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';

export interface DataCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: LucideIcon;
  }>;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
    disabled?: boolean;
  }>;
  children?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export const DataCard: React.FC<DataCardProps> = ({
  title,
  description,
  icon: Icon,
  badge,
  stats = [],
  actions = [],
  children,
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5" />}
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {badge && (
            <Badge variant={badge.variant || 'default'}>
              {badge.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      {(stats.length > 0 || children) && (
        <CardContent>
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {stats.map((stat, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    {stat.icon && <stat.icon className="h-3 w-3" />}
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
          {children}
        </CardContent>
      )}
      
      {actions.length > 0 && (
        <CardFooter className="flex gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              onClick={action.onClick}
              disabled={action.disabled}
              size="sm"
            >
              {action.label}
            </Button>
          ))}
        </CardFooter>
      )}
    </Card>
  );
};

// List Card Component for displaying items in a list format
export interface ListCardProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  title?: string;
  description?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

export function ListCard<T>({
  items,
  renderItem,
  title,
  description,
  emptyMessage = 'No items found',
  isLoading = false,
  className = '',
}: ListCardProps<T>) {
  if (isLoading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            {description && <Skeleton className="h-4 w-64 mt-2" />}
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="pb-3 last:pb-0 border-b last:border-0">
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Grid Card Layout Component
export interface GridCardsProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GridCards: React.FC<GridCardsProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = '',
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };
  
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };
  
  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};