/**
 * DirectoryImportWizard Component
 *
 * Multi-step wizard for importing comedian profiles from CSV
 * and matching photos from folders.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FolderOpen,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { directoryImportService } from '@/services/directory/import-service';
import type {
  DirectoryImportValidation,
  DirectoryImportResult,
  ImportDirectoryProfileRow,
} from '@/types/directory';

interface DirectoryImportWizardProps {
  onComplete: () => void;
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

const IMPORT_FIELDS = [
  { value: 'stage_name', label: 'Stage Name', required: true },
  { value: 'email', label: 'Email', required: false },
  { value: 'legal_name', label: 'Legal Name', required: false },
  { value: 'first_name', label: 'First Name', required: false },
  { value: 'last_name', label: 'Last Name', required: false },
  { value: 'short_bio', label: 'Bio', required: false },
  { value: 'origin_city', label: 'City/State', required: false },
  { value: 'origin_country', label: 'Country', required: false },
  { value: 'website', label: 'Website', required: false },
  { value: 'booking_email', label: 'Booking Email', required: false },
  { value: 'instagram_url', label: 'Instagram', required: false },
  { value: 'facebook_url', label: 'Facebook', required: false },
  { value: 'tiktok_url', label: 'TikTok', required: false },
  { value: 'youtube_url', label: 'YouTube', required: false },
  { value: 'abn', label: 'ABN', required: false },
  { value: 'tags', label: 'Tags (comma-separated)', required: false },
  { value: 'ignore', label: '-- Ignore Column --', required: false },
];

export function DirectoryImportWizard({ onComplete }: DirectoryImportWizardProps) {
  const { theme } = useTheme();
  const { toast } = useToast();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('upload');

  // CSV data
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Validation results
  const [validation, setValidation] = useState<DirectoryImportValidation | null>(null);
  const [validRows, setValidRows] = useState<ImportDirectoryProfileRow[]>([]);

  // Import progress
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<DirectoryImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/[0.08] backdrop-blur-md border-white/[0.15] text-white';
    }
    return 'bg-gray-800/90 border-gray-600 text-gray-100';
  };

  // Handle CSV file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setIsProcessing(true);

    try {
      const result = await directoryImportService.parseCSV(file);
      setCsvHeaders(result.headers);
      setCsvRows(result.rows);

      // Auto-detect column mappings
      const mappings = directoryImportService.detectColumnMappings(result.headers);
      setColumnMapping(mappings);

      setStep('mapping');
    } catch (error) {
      console.error('Failed to parse CSV:', error);
      toast({
        title: 'Parse Error',
        description: error instanceof Error ? error.message : 'Failed to parse CSV file',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // Handle column mapping change
  const handleMappingChange = (csvHeader: string, importField: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvHeader]: importField,
    }));
  };

  // Validate and preview
  const handlePreview = async () => {
    setIsProcessing(true);
    try {
      const result = await directoryImportService.validateAndMapRows(
        csvHeaders,
        csvRows,
        columnMapping
      );
      setValidation(result);
      setValidRows(result.validRows);
      setStep('preview');
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: 'Validation Error',
        description: 'Failed to validate CSV data',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute import
  const handleImport = async () => {
    if (validRows.length === 0) return;

    setStep('importing');
    setImportProgress(0);

    try {
      const result = await directoryImportService.importDirectoryProfiles(
        validRows,
        'csv_import',
        (progress) => setImportProgress(progress)
      );

      setImportResult(result);
      setStep('complete');

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.successCount} profiles`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred during import',
        variant: 'destructive',
      });
      setStep('preview'); // Go back to preview on error
    }
  };

  // Reset wizard
  const handleReset = () => {
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMapping({});
    setValidation(null);
    setValidRows([]);
    setImportProgress(0);
    setImportResult(null);
    setStep('upload');
  };

  // Check if stage_name is mapped
  const isStageNameMapped = Object.values(columnMapping).includes('stage_name');

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-4">
        {(['upload', 'mapping', 'preview', 'complete'] as const).map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                step === s || (['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) > i)
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/50'
              )}
            >
              {i + 1}
            </div>
            {i < 3 && (
              <div className={cn(
                "w-12 h-0.5 mx-2",
                ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) > i
                  ? 'bg-purple-500'
                  : 'bg-white/10'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <Card className={cn(getCardStyles())}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload CSV File
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/40 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ensure your CSV has column headers in the first row</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-white/40" />
              <p className="text-lg mb-2">Drop your CSV file here or click to browse</p>
              <p className="text-sm text-white/50 mb-4">
                CSV must have headers. Map any columns to platform fields in the next step.
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="secondary" asChild className="cursor-pointer text-white border-white/20">
                  <span>
                    {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Select CSV File
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Column Mapping */}
      {step === 'mapping' && (
        <Card className={cn(getCardStyles())}>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <p className="text-sm text-white/60">
              Match your CSV columns to profile fields. Stage Name is required.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {csvHeaders.map((header) => (
                <div key={header} className="flex items-center gap-4">
                  <div className="w-1/3">
                    <Badge variant="secondary" className="text-white border-white/30">
                      {header}
                    </Badge>
                    <span className="ml-2 text-xs text-white/40">
                      ({csvRows[0]?.[csvHeaders.indexOf(header)] ?? '-'})
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/40" />
                  <Select
                    value={columnMapping[header] ?? 'ignore'}
                    onValueChange={(value) => handleMappingChange(header, value)}
                  >
                    <SelectTrigger className="w-1/2 bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPORT_FIELDS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                          {field.required && ' *'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              {!isStageNameMapped && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 rounded-lg text-red-300">
                  <AlertCircle className="h-5 w-5" />
                  <span>Stage Name must be mapped to continue</span>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="secondary"
                onClick={handleReset}
                className="text-white border-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!isStageNameMapped || isProcessing}
              >
                {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Preview Import
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Preview */}
      {step === 'preview' && validation && (
        <Card className={cn(getCardStyles())}>
          <CardHeader>
            <CardTitle>Preview Import</CardTitle>
            <div className="flex gap-4 mt-2">
              <Badge variant="secondary" className="text-green-400 border-green-400/50">
                {validation.validCount} valid
              </Badge>
              {validation.skippedCount > 0 && (
                <Badge variant="secondary" className="text-yellow-400 border-yellow-400/50">
                  {validation.skippedCount} skipped
                </Badge>
              )}
              {validation.errorCount > 0 && (
                <Badge variant="secondary" className="text-red-400 border-red-400/50">
                  {validation.errorCount} errors
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Errors */}
            {validation.errors.length > 0 && (
              <div className="mb-4 p-3 bg-red-500/20 rounded-lg">
                <p className="font-medium text-red-300 mb-2">Errors:</p>
                <ul className="text-sm text-red-200 space-y-1">
                  {validation.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>Row {err.row}: {err.message}</li>
                  ))}
                  {validation.errors.length > 5 && (
                    <li>...and {validation.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview table */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/60">Stage Name</TableHead>
                    <TableHead className="text-white/60">Email</TableHead>
                    <TableHead className="text-white/60">Location</TableHead>
                    <TableHead className="text-white/60">Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validRows.slice(0, 10).map((row, i) => (
                    <TableRow key={i} className="border-white/10">
                      <TableCell className="text-white">{row.stage_name}</TableCell>
                      <TableCell className="text-white/70">{row.email ?? '-'}</TableCell>
                      <TableCell className="text-white/70">{row.location ?? '-'}</TableCell>
                      <TableCell>
                        {row.tags?.split(',').slice(0, 2).map((tag, ti) => (
                          <Badge key={ti} variant="secondary" className="mr-1 text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {validRows.length > 10 && (
                <div className="p-2 text-center text-sm text-white/50 border-t border-white/10">
                  ...and {validRows.length - 10} more profiles
                </div>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="secondary"
                onClick={() => setStep('mapping')}
                className="text-white border-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Mapping
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0}
              >
                Import {validRows.length} Profiles
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <Card className={cn(getCardStyles())}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Importing Profiles...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={importProgress} className="h-3" />
            <p className="text-center mt-4 text-white/60">
              {Math.round(importProgress)}% complete
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step: Complete */}
      {step === 'complete' && importResult && (
        <Card className={cn(getCardStyles())}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-500/20 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {importResult.successCount}
                </div>
                <div className="text-sm text-green-300">Imported</div>
              </div>
              <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  {importResult.skippedCount}
                </div>
                <div className="text-sm text-yellow-300">Skipped</div>
              </div>
              <div className="text-center p-4 bg-red-500/20 rounded-lg">
                <div className="text-2xl font-bold text-red-400">
                  {importResult.errorCount}
                </div>
                <div className="text-sm text-red-300">Errors</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mb-4 p-3 bg-red-500/20 rounded-lg">
                <p className="font-medium text-red-300 mb-2">Errors:</p>
                <ul className="text-sm text-red-200 space-y-1">
                  {importResult.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <Button
                variant="secondary"
                onClick={handleReset}
                className="text-white border-white/20"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Import More
              </Button>
              <Button onClick={onComplete}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
