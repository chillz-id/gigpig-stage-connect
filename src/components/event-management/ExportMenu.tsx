/**
 * ExportMenu Component
 *
 * Dropdown menu for exporting event management data.
 * Provides CSV and PDF export options for different data types.
 */

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  exportApplicationsToCSV,
  exportApplicationsToPDF,
  exportLineupToCSV,
  exportLineupToPDF,
  exportFinancialReportToCSV,
  exportFinancialReportToPDF,
} from '@/services/exportService';

interface ExportMenuProps {
  eventId: string;
  eventTitle: string;
  userId: string;
  isOwner: boolean;
  exportType: 'applications' | 'lineup' | 'financial';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function ExportMenu({
  eventId,
  eventTitle,
  userId,
  isOwner,
  exportType,
  variant = 'secondary',
  size = 'sm',
}: ExportMenuProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);

    try {
      if (exportType === 'applications') {
        if (format === 'csv') {
          await exportApplicationsToCSV(eventId);
        } else {
          await exportApplicationsToPDF(eventId, eventTitle);
        }
      } else if (exportType === 'lineup') {
        if (format === 'csv') {
          await exportLineupToCSV(eventId);
        } else {
          await exportLineupToPDF(eventId, eventTitle);
        }
      } else if (exportType === 'financial') {
        if (format === 'csv') {
          await exportFinancialReportToCSV(eventId, userId, isOwner);
        } else {
          await exportFinancialReportToPDF(eventId, eventTitle, userId, isOwner);
        }
      }

      toast({
        title: 'Export successful',
        description: `${getExportLabel(exportType)} exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export data',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export as...</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          CSV (Spreadsheet)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="mr-2 h-4 w-4" />
          PDF (Document)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getExportLabel(type: 'applications' | 'lineup' | 'financial'): string {
  switch (type) {
    case 'applications':
      return 'Applications';
    case 'lineup':
      return 'Lineup';
    case 'financial':
      return 'Financial report';
    default:
      return 'Data';
  }
}
