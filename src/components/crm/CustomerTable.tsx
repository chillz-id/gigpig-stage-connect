import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Customer, CustomerSortOptions } from '@/hooks/useCustomers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, formatPhone } from '@/utils/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { CustomerCard } from './CustomerCard';
import type { ColumnConfig } from '@/types/column-config';
import { DEFAULT_CUSTOMER_COLUMNS } from '@/types/column-config';
import {
  buildCustomerColumns,
  getCustomerFullName,
  getCustomerAddress,
  getSegmentBadgeClass,
  getLeadScoreBadgeClass,
  type CustomerTableColumn,
} from '@/utils/crm/customer';

interface CustomerTableProps {
  customers: Customer[];
  isLoading?: boolean;
  onSortChange?: (sort: CustomerSortOptions) => void;
  currentSort?: CustomerSortOptions;
  columnConfigs?: ColumnConfig[];
  onColumnResize?: (columnId: string, width: number) => void;
  enableVirtualization?: boolean;
}

/**
 * CustomerTable Component
 *
 * Displays customers in a table with:
 * - Sortable columns
 * - Click row to view detail
 * - Customer segment badges
 * - Formatted currency and dates
 */
export const CustomerTable = ({
  customers,
  isLoading = false,
  onSortChange,
  currentSort,
  columnConfigs,
  onColumnResize,
  enableVirtualization = import.meta.env.VITE_ENABLE_CUSTOMER_VIRTUALIZATION === 'true',
}: CustomerTableProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [resizing, setResizing] = useState<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const scrollParentRef = useRef<HTMLDivElement | null>(null);

  // Apply resize cursor to body during drag for smooth experience
  useEffect(() => {
    if (resizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizing]);

  const columns = useMemo<CustomerTableColumn[]>(() => buildCustomerColumns(DEFAULT_CUSTOMER_COLUMNS, columnConfigs), [columnConfigs]);

  const virtualizationEnabled = enableVirtualization && !isMobile;

  const rowVirtualizer = virtualizationEnabled
    ? useVirtualizer({
        count: customers.length,
        getScrollElement: () => scrollParentRef.current,
        estimateSize: () => 64,
        overscan: 8,
      })
    : null;

  const visibleColumns = useMemo(() => columns.filter((column) => column.visible !== false), [columns]);

  if (isMobile) {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border bg-card p-4">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      );
    }

    if (customers.length === 0) {
      return (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">No customers found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your filters or search criteria
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {customers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onClick={() => navigate(`/crm/customers/${customer.id}`)}
          />
        ))}
      </div>
    );
  }

  const handleSort = (column: CustomerSortOptions['column']) => {
    if (!onSortChange) return;

    const newSort: CustomerSortOptions = {
      column,
      ascending:
        currentSort?.column === column ? !currentSort.ascending : false,
    };

    onSortChange(newSort);
  };

  const getSortIcon = (column: CustomerSortOptions['column']) => {
    if (currentSort?.column !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }

    return currentSort.ascending ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  // Column resizing handlers
  const handleResizeStart = useCallback((
    e: React.MouseEvent,
    columnId: string,
    currentWidth: number,
    minWidth: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(columnId);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!onColumnResize) return;
      const delta = moveEvent.clientX - startXRef.current;
      const newWidth = Math.max(minWidth, startWidthRef.current + delta);
      onColumnResize(columnId, newWidth);
    };

    const handleMouseUp = () => {
      setResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onColumnResize]);

  // Auto-fit column to content width on double-click
  const handleAutoFit = useCallback((columnId: string, minWidth: number) => {
    if (!onColumnResize) return;

    // Measure the max content width for this column
    const cells = document.querySelectorAll(`[data-column-id="${columnId}"]`);
    let maxWidth = minWidth;

    cells.forEach((cell) => {
      // Create a temporary span to measure text width
      const content = cell.textContent || '';
      const span = document.createElement('span');
      span.style.visibility = 'hidden';
      span.style.position = 'absolute';
      span.style.whiteSpace = 'nowrap';
      span.style.font = window.getComputedStyle(cell).font;
      span.textContent = content;
      document.body.appendChild(span);
      const width = span.offsetWidth + 32; // Add padding
      document.body.removeChild(span);
      maxWidth = Math.max(maxWidth, width);
    });

    // Cap at reasonable max width
    const finalWidth = Math.min(maxWidth, 400);
    onColumnResize(columnId, finalWidth);
  }, [onColumnResize]);

  // Render cell content based on column type
  const renderCellContent = (column: CustomerTableColumn, customer: Customer) => {
    switch (column.id) {
      case 'name':
        return <span className="font-medium">{getCustomerFullName(customer)}</span>;
      case 'email':
        return customer.email || '-';
      case 'phone':
        return formatPhone(customer.mobile || customer.phone);
      case 'landline':
        return formatPhone(customer.landline || customer.phone);
      case 'segments':
        if (!customer.customer_segments || customer.customer_segments.length === 0) {
          return '-';
        }
        return (
          <div className="flex flex-wrap gap-1">
            {customer.customer_segments.map((segment) => (
              <Badge key={segment} className={getSegmentBadgeClass(segment)}>
                {segment.toUpperCase()}
              </Badge>
            ))}
          </div>
        );
      case 'lead_score':
        return typeof customer.lead_score === 'number'
          ? (
              <Badge className={getLeadScoreBadgeClass(customer.lead_score)}>
                {customer.lead_score}
              </Badge>
            )
          : '-';
      case 'total_orders':
        return customer.total_orders ?? 0;
      case 'total_spent':
        return formatCurrency(Number(customer.total_spent) || 0);
      case 'last_order_date':
        return formatDate(customer.last_order_date);
      case 'company':
        return customer.company || '-';
      case 'address':
        return getCustomerAddress(customer);
      case 'address_line1':
        return customer.address_line1 || '-';
      case 'address_line2':
        return customer.address_line2 || '-';
      case 'suburb':
        return customer.suburb || '-';
      case 'city':
        return customer.city || '-';
      case 'state':
        return customer.state || '-';
      case 'postcode':
        return customer.postcode || '-';
      case 'country':
        return customer.country || '-';
      case 'date_of_birth':
        return formatDate(customer.date_of_birth);
      case 'age_band':
        return customer.age_band || '-';
      case 'marketing_opt_in':
        if (customer.marketing_opt_in === null || customer.marketing_opt_in === undefined) {
          return '-';
        }
        return customer.marketing_opt_in ? (
          <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
            Opted In
          </Badge>
        ) : (
          <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-300">
            Opted Out
          </Badge>
        );
      case 'source':
        return customer.source || '-';
      case 'preferred_venue':
        return customer.preferred_venue || '-';
      case 'last_event_name':
        return customer.last_event_name || '-';
      case 'customer_since':
        return formatDate(customer.customer_since);
      case 'updated_at':
        return formatDateTime(customer.updated_at);
      default: {
        const value = (customer as Record<string, unknown>)[column.accessor];
        if (value === null || value === undefined || value === '') {
          return '-';
        }
        if (typeof value === 'number' || typeof value === 'string') {
          return value;
        }
        return String(value);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
            {visibleColumns.map((column) => (
              <TableHead
                key={column.id}
                style={{ width: `${column.width}px`, minWidth: `${column.minWidth}px` }}
                className={
                  column.alignment === 'right'
                    ? 'text-right'
                    : column.alignment === 'center'
                    ? 'text-center'
                    : 'text-left'
                }
              >
                {column.label}
              </TableHead>
            ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {visibleColumns.map((column) => (
                  <TableCell key={column.id} style={{ width: `${column.width}px` }}>
                    <div className="h-4 bg-gray-200 animate-pulse rounded" style={{ width: `${column.width * 0.7}px` }} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground">No customers found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  const renderRow = (customer: Customer, key: string | number, style?: CSSProperties) => (
    <TableRow
      key={key}
      style={style}
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => navigate(`/crm/customers/${customer.id}`)}
    >
      {visibleColumns.map((column) => {
        const alignmentClass =
          column.alignment === 'right'
            ? 'text-right'
            : column.alignment === 'center'
            ? 'text-center'
            : 'text-left';
        return (
          <TableCell
            key={column.id}
            className={alignmentClass}
            style={{ width: `${column.width}px` }}
            data-column-id={column.id}
          >
            {renderCellContent(column, customer)}
          </TableCell>
        );
      })}
    </TableRow>
  );

  const tableHeader = (
    <TableHeader>
      <TableRow>
        {visibleColumns.map((column) => {
          const alignmentClass =
            column.alignment === 'right'
              ? 'text-right'
              : column.alignment === 'center'
              ? 'text-center'
              : 'text-left';
          return (
            <TableHead
              key={column.id}
              className={`relative group ${alignmentClass}`}
              style={{ width: `${column.width}px`, minWidth: `${column.minWidth}px` }}
            >
              {column.sortable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort(column.accessor as CustomerSortOptions['column'])}
                  className={`hover:bg-transparent w-full ${
                    column.alignment === 'right'
                      ? 'justify-end'
                      : column.alignment === 'center'
                      ? 'justify-center'
                      : 'justify-start'
                  }`}
                >
                  {column.label}
                  {getSortIcon(column.accessor as CustomerSortOptions['column'])}
                </Button>
              ) : (
                column.label
              )}
              {onColumnResize && (
                <div
                  className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all duration-150 ${
                    resizing === column.id
                      ? 'bg-purple-500 w-1'
                      : 'bg-transparent hover:bg-purple-400 group-hover:bg-purple-300/50'
                  }`}
                  onMouseDown={(e) => handleResizeStart(e, column.id, column.width, column.minWidth)}
                  onDoubleClick={() => handleAutoFit(column.id, column.minWidth)}
                  title="Drag to resize, double-click to auto-fit"
                />
              )}
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );

  const tableBody = virtualizationEnabled && rowVirtualizer
    ? (
        <TableBody
          style={{
            position: 'relative',
            height: rowVirtualizer.getTotalSize(),
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            renderRow(customers[virtualRow.index]!, virtualRow.key, {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            })
          ))}
        </TableBody>
      )
    : (
        <TableBody>
          {customers.map((customer) => renderRow(customer, customer.id))}
        </TableBody>
      );

  return (
    <div className="rounded-md border overflow-x-auto">
      {virtualizationEnabled ? (
        <div ref={scrollParentRef} className="max-h-[70vh] overflow-auto">
          <Table>
            {tableHeader}
            {tableBody}
          </Table>
        </div>
      ) : (
        <Table>
          {tableHeader}
          {tableBody}
        </Table>
      )}
    </div>
  );
};
