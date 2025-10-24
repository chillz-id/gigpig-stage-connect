import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface TaskStatisticsWidgetProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  variant?: 'default' | 'warning' | 'destructive' | 'success';
}

export default function TaskStatisticsWidget({
  title,
  value,
  description,
  icon: Icon,
  variant = 'default'
}: TaskStatisticsWidgetProps) {
  const iconColorClass = {
    default: 'text-muted-foreground',
    warning: 'text-yellow-500',
    destructive: 'text-red-500',
    success: 'text-green-500',
  }[variant];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
