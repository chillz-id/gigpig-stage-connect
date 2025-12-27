import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { FileUp, Upload, AlertCircle, CheckCircle2, XCircle, Download, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  parseCSV,
  detectColumnMappings,
  validateAndMapRows,
  importCustomers,
  type ImportCustomerRow,
  type ParsedCSV,
  type ValidationResult,
  type ImportResult,
} from '@/services/crm/import-service';
import { segmentService } from '@/services/crm/segment-service';
import { useExportCustomers } from '@/hooks/useCustomers';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

const IMPORT_FIELDS: Array<{ key: keyof ImportCustomerRow; label: string; required?: boolean }> = [
  { key: 'email', label: 'Email', required: true },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'address_line1', label: 'Address Line 1' },
  { key: 'address_line2', label: 'Address Line 2' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'country', label: 'Country' },
  { key: 'date_of_birth', label: 'Date of Birth' },
  { key: 'marketing_opt_in', label: 'Marketing Opt In' },
  { key: 'notes', label: 'Notes' },
];

export const ImportExportPage = () => {
  const [searchParams] = useSearchParams();
  const segmentSlug = searchParams.get('segment');

  const [step, setStep] = useState<ImportStep>('upload');
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, keyof ImportCustomerRow>>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch target segment details if slug is provided
  const { data: targetSegment } = useQuery({
    queryKey: ['segment', segmentSlug],
    queryFn: () => segmentService.getBySlug(segmentSlug!),
    enabled: !!segmentSlug,
  });

  const exportMutation = useExportCustomers();

  const handleFileDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);

      if (parsed.rows.length === 0) {
        toast.error('CSV file is empty or could not be parsed');
        return;
      }

      setParsedCSV(parsed);
      const detectedMappings = detectColumnMappings(parsed.headers);
      setColumnMappings(detectedMappings);
      setStep('mapping');
      toast.success(`Loaded ${parsed.rows.length} rows from CSV`);
    };

    reader.onerror = () => {
      toast.error('Failed to read CSV file');
    };

    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleMappingChange = (csvColumn: string, importField: string) => {
    setColumnMappings(prev => {
      const next = { ...prev };
      if (importField === '') {
        delete next[csvColumn];
      } else {
        next[csvColumn] = importField as keyof ImportCustomerRow;
      }
      return next;
    });
  };

  const handleValidateAndPreview = () => {
    if (!parsedCSV) return;

    const result = validateAndMapRows(parsedCSV.rows, columnMappings);
    setValidation(result);
    setStep('preview');
  };

  const handleStartImport = async () => {
    if (!validation?.mappedRows.length) return;

    setIsImporting(true);
    setStep('importing');
    setImportProgress(0);

    try {
      const result = await importCustomers(
        validation.mappedRows,
        50,
        (processed, total) => {
          setImportProgress(Math.round((processed / total) * 100));
        },
        targetSegment?.id // Pass segment ID if importing to a segment
      );

      setImportResult(result);
      setStep('complete');

      if (result.failed === 0) {
        const segmentMsg = targetSegment ? ` and added to "${targetSegment.name}"` : '';
        toast.success(`Successfully imported ${result.created + result.updated} customers${segmentMsg}`);
      } else {
        toast.warning(`Import completed with ${result.failed} errors`);
      }
    } catch (error) {
      toast.error('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setStep('preview');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setParsedCSV(null);
    setColumnMappings({});
    setValidation(null);
    setImportProgress(0);
    setImportResult(null);
  };

  const handleExport = async () => {
    try {
      const count = await exportMutation.mutateAsync({});
      toast.success(`Exported ${count} customers to CSV`);
    } catch (error) {
      toast.error('Failed to export customers');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Import / Export</h1>
          <p className="text-muted-foreground">
            Import customers from CSV or export your customer data
          </p>
        </div>
        <Button onClick={handleExport} disabled={exportMutation.isPending}>
          <Download className="mr-2 h-4 w-4" />
          Export All Customers
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Import Customers
            </CardTitle>
            <CardDescription>
              Upload a CSV file to import or update customer records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {targetSegment && (
              <Alert className="mb-4 border-purple-500/50 bg-purple-500/10">
                <Tag className="h-4 w-4 text-purple-500" />
                <AlertTitle className="text-purple-700 dark:text-purple-300">
                  Importing to Segment: {targetSegment.name}
                </AlertTitle>
                <AlertDescription>
                  Imported customers will automatically be added to this segment.
                </AlertDescription>
              </Alert>
            )}
            {step === 'upload' && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-muted-foreground/25 hover:border-purple-500/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop your CSV file here' : 'Drag & drop a CSV file'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  or click to browse your files
                </p>
              </div>
            )}

            {step === 'mapping' && parsedCSV && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {parsedCSV.rows.length} rows found. Map your CSV columns to customer fields.
                  </p>
                  <Button variant="secondary" size="sm" onClick={handleReset}>
                    Start Over
                  </Button>
                </div>

                <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CSV Column</TableHead>
                        <TableHead>Maps To</TableHead>
                        <TableHead>Sample Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedCSV.headers.map((header, index) => (
                        <TableRow key={header}>
                          <TableCell className="font-medium">{header}</TableCell>
                          <TableCell>
                            <Select
                              value={columnMappings[header] ?? ''}
                              onValueChange={(value) => handleMappingChange(header, value)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select field..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">-- Skip --</SelectItem>
                                {IMPORT_FIELDS.map((field) => (
                                  <SelectItem key={field.key} value={field.key}>
                                    {field.label}
                                    {field.required && ' *'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                            {parsedCSV.rows[0]?.[header] ?? '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button onClick={handleValidateAndPreview} className="w-full">
                  Validate & Preview
                </Button>
              </div>
            )}

            {step === 'preview' && validation && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant={validation.valid ? 'default' : 'destructive'}>
                      {validation.mappedRows.length} valid rows
                    </Badge>
                    {validation.errors.length > 0 && (
                      <Badge variant="destructive">{validation.errors.length} errors</Badge>
                    )}
                    {validation.warnings.length > 0 && (
                      <Badge variant="secondary">{validation.warnings.length} warnings</Badge>
                    )}
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setStep('mapping')}>
                    Back to Mapping
                  </Button>
                </div>

                {validation.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Validation Errors</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside mt-2 text-sm max-h-[150px] overflow-y-auto">
                        {validation.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validation.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warnings</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside mt-2 text-sm max-h-[100px] overflow-y-auto">
                        {validation.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validation.valid && validation.mappedRows.length > 0 && (
                  <>
                    <Alert>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertTitle>Ready to Import</AlertTitle>
                      <AlertDescription>
                        {validation.mappedRows.length} customers will be imported. Existing customers
                        (matched by email) will be updated.
                      </AlertDescription>
                    </Alert>

                    <Button onClick={handleStartImport} className="w-full" disabled={isImporting}>
                      {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Import {validation.mappedRows.length} Customers
                    </Button>
                  </>
                )}
              </div>
            )}

            {step === 'importing' && (
              <div className="space-y-4 py-8">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-500 mb-4" />
                  <p className="text-lg font-medium">Importing customers...</p>
                  <p className="text-sm text-muted-foreground">Please don't close this page</p>
                </div>
                <Progress value={importProgress} className="h-2" />
                <p className="text-center text-sm text-muted-foreground">{importProgress}%</p>
              </div>
            )}

            {step === 'complete' && importResult && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  {importResult.failed === 0 ? (
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  ) : (
                    <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                  )}
                  <p className="text-lg font-medium">Import Complete</p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-green-500">{importResult.created}</p>
                    <p className="text-sm text-muted-foreground">Created</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-blue-500">{importResult.updated}</p>
                    <p className="text-sm text-muted-foreground">Updated</p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-red-500">{importResult.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Failed Records</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside mt-2 text-sm max-h-[150px] overflow-y-auto">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>
                            {err.email}: {err.error}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleReset} className="w-full">
                  Import Another File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Import Guide</CardTitle>
            <CardDescription>How to prepare your CSV file for import</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Required Fields</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <strong>Email</strong> - Used to match existing customers
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Optional Fields</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>First Name, Last Name</li>
                <li>Phone / Mobile</li>
                <li>Company</li>
                <li>Address (Line 1, Line 2, Suburb, City, State, Postcode, Country)</li>
                <li>Date of Birth (YYYY-MM-DD or DD/MM/YYYY)</li>
                <li>Marketing Opt In (true/false, yes/no, 1/0)</li>
                <li>Notes</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">How It Works</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Customers are matched by email address</li>
                <li>New emails create new customer records</li>
                <li>Existing emails update the customer profile</li>
                <li>Empty fields in the CSV won't overwrite existing data</li>
              </ul>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Column names are automatically detected. Common variations like "First Name",
                "firstname", and "given name" are supported.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
