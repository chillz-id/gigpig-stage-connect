import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const normalizedStatus = status.toLowerCase();

  const variants: Record<string, string> = {
    complete: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    refunded: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const className = variants[normalizedStatus] || variants.pending;

  return (
    <Badge variant="secondary" className={`${className} text-xs`}>
      {status}
    </Badge>
  );
};
