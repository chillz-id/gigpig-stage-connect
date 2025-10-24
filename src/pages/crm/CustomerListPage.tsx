import { useEffect, useState } from 'react';
import {
  useCustomers,
  useExportCustomers,
  useCustomerStats,
  useRefreshCustomerStats,
} from '@/hooks/useCustomers';
import type { CustomerFilters, CustomerSortOptions } from '@/hooks/useCustomers';
import { CustomerTable } from '@/components/crm/CustomerTable';
import { CustomerFilters as CustomerFiltersComponent } from '@/components/crm/CustomerFilters';
import { ColumnCustomizer } from '@/components/crm/ColumnCustomizer';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useColumnSettings } from '@/hooks/useColumnSettings';
import { DEFAULT_CUSTOMER_COLUMNS } from '@/types/column-config';

/**
 * Customer List Page
 *
 * Displays all customers with:
 * - Table view with sorting and filtering
 * - Search by name, email, phone
 * - Segment filters (VIP, Regular, New, etc.)
 * - Bulk actions (export, segment assignment)
 * - Click row to view customer detail
 */
export const CustomerListPage = () => {
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [sort, setSort] = useState<CustomerSortOptions>({
    column: 'last_order_date',
    ascending: false,
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  const { data, isLoading, refetch, isFetching } = useCustomers(
    filters,
    sort,
    pageSize,
    page * pageSize
  );

  const { data: stats, isLoading: statsLoading } = useCustomerStats();
  const refreshStats = useRefreshCustomerStats();

  useEffect(() => {
    refreshStats.mutate(undefined, { onError: () => {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const exportMutation = useExportCustomers();

  // Column customization hook
  const {
    columns,
    templates,
    activeTemplateId,
    onConfigsChange,
    onTemplateSelect,
    onTemplateSave,
    onTemplateDelete,
  } = useColumnSettings();

  const handleColumnResize = (columnId: string, width: number) => {
    const newConfigs = columns.map((col) =>
      col.id === columnId ? { ...col, width } : col
    );
    onConfigsChange(newConfigs);
  };

  const handleExport = async () => {
    try {
      const count = await exportMutation.mutateAsync(filters);
      toast.success(`Exported ${count} customers to CSV`);
    } catch (error) {
      toast.error('Failed to export customers');
      console.error('Export error:', error);
    }
  };

  const handleFiltersChange = (newFilters: CustomerFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  };

  const handleFiltersReset = () => {
    setFilters({});
    setPage(0);
  };

  const handleSortChange = (newSort: CustomerSortOptions) => {
    setSort(newSort);
  };

  const handlePageSizeChange = (value: string) => {
    const nextSize = Number(value);
    if (!Number.isNaN(nextSize) && nextSize > 0) {
      setPageSize(nextSize);
      setPage(0);
    }
  };

  const totalPages = data && pageSize > 0 ? Math.ceil(data.totalCount / pageSize) : 0;
  const pageSizeOptions = [50, 100, 250, 500];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            {stats ? (
              <>
                Total customers {stats.total_count.toLocaleString('en-AU')} • Showing {data?.customers.length ?? 0}
              </>
            ) : (
              'Manage and view all customer data'
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[90px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ColumnCustomizer
            columnDefinitions={DEFAULT_CUSTOMER_COLUMNS}
            currentConfigs={columns}
            templates={templates}
            activeTemplateId={activeTemplateId}
            onConfigsChange={onConfigsChange}
            onTemplateSelect={onTemplateSelect}
            onTemplateSave={onTemplateSave}
            onTemplateDelete={onTemplateDelete}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            disabled={exportMutation.isPending || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CustomerFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleFiltersReset}
      />

      {/* Table */}
      <CustomerTable
        customers={data?.customers || []}
        isLoading={isLoading}
        onSortChange={handleSortChange}
        currentSort={sort}
        columnConfigs={columns}
        onColumnResize={handleColumnResize}
      />

      {/* Pagination */}
      {data && data.totalCount > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 0 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1 || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
