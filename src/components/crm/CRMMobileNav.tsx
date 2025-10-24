import { Link, useLocation } from 'react-router-dom';
import { Users, Handshake, CheckSquare, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { to: '/crm/customers', label: 'Customers', icon: Users },
  { to: '/crm/deals', label: 'Deals', icon: Handshake },
  { to: '/crm/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/crm/relationships', label: 'Contacts', icon: Network },
];

export const CRMMobileNav = () => {
  const location = useLocation();

  return (
    <nav
      aria-label="CRM navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:hidden"
    >
      <ul className="mx-auto grid max-w-4xl grid-cols-4">
        {LINKS.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
