import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { lookupABN, cleanABN } from '@/utils/abn';

interface ABNRecord {
  abn: string;
  gstRegistered?: string | boolean;
  [key: string]: any;
}

interface EnrichedABNRecord extends ABNRecord {
  entityName?: string;
  entityType?: string;
  address?: string;
  stateCode?: string;
  postcode?: string;
  isActive?: boolean;
  gstEffectiveDate?: string;
  lookupStatus: 'success' | 'failed' | 'pending';
  error?: string;
}

export default function ABNChecker() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<ABNRecord[]>([]);
  const [enrichedRecords, setEnrichedRecords] = useState<EnrichedABNRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setRecords([]);
    setEnrichedRecords([]);
    setProgress(0);
    setStats({ total: 0, success: 0, failed: 0 });

    try {
      const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        // Parse CSV
        Papa.parse(uploadedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedRecords = results.data as ABNRecord[];

            // Validate that ABN column exists
            if (parsedRecords.length > 0 && !parsedRecords[0]!.abn && !parsedRecords[0]!.ABN) {
              toast({
                title: 'Invalid file format',
                description: 'File must contain an "ABN" or "abn" column',
                variant: 'destructive',
              });
              setFile(null);
              return;
            }

            // Normalize ABN column name
            const normalizedRecords = parsedRecords.map(record => ({
              ...record,
              abn: record.abn || record.ABN || '',
            }));

            setRecords(normalizedRecords);
            toast({
              title: 'File uploaded successfully',
              description: `Found ${normalizedRecords.length} ABNs to process`,
            });
          },
          error: (error) => {
            toast({
              title: 'Failed to parse CSV',
              description: error.message,
              variant: 'destructive',
            });
            setFile(null);
          },
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName!];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ABNRecord[];

        // Validate that ABN column exists
        if (jsonData.length > 0 && !jsonData[0]!.abn && !jsonData[0]!.ABN) {
          toast({
            title: 'Invalid file format',
            description: 'File must contain an "ABN" or "abn" column',
            variant: 'destructive',
          });
          setFile(null);
          return;
        }

        // Normalize ABN column name
        const normalizedRecords = jsonData.map(record => ({
          ...record,
          abn: record.abn || record.ABN || '',
        }));

        setRecords(normalizedRecords);
        toast({
          title: 'File uploaded successfully',
          description: `Found ${normalizedRecords.length} ABNs to process`,
        });
      } else {
        toast({
          title: 'Unsupported file type',
          description: 'Please upload a CSV or Excel file',
          variant: 'destructive',
        });
        setFile(null);
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: 'Failed to process file',
        description: 'Please check the file format and try again',
        variant: 'destructive',
      });
      setFile(null);
    }
  };

  const processABNs = async () => {
    if (records.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setStats({ total: records.length, success: 0, failed: 0 });

    const enriched: EnrichedABNRecord[] = [];
    let successCount = 0;
    let failedCount = 0;

    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (record) => {
          try {
            const abn = cleanABN(record.abn);
            if (!abn) {
              failedCount++;
              return {
                ...record,
                lookupStatus: 'failed' as const,
                error: 'Invalid ABN format',
              };
            }

            const result = await lookupABN(abn);

            if (result) {
              successCount++;
              return {
                ...record,
                abn: result.abn,
                entityName: result.entityName,
                entityType: result.entityType,
                gstRegistered: result.gstRegistered,
                gstEffectiveDate: result.gstEffectiveDate,
                address: result.address,
                stateCode: result.stateCode,
                postcode: result.postcode,
                isActive: result.isActive,
                lookupStatus: 'success' as const,
              };
            } else {
              failedCount++;
              return {
                ...record,
                lookupStatus: 'failed' as const,
                error: 'Lookup failed',
              };
            }
          } catch (error) {
            failedCount++;
            return {
              ...record,
              lookupStatus: 'failed' as const,
              error: 'Error during lookup',
            };
          }
        })
      );

      enriched.push(...batchResults);
      setEnrichedRecords([...enriched]);
      setProgress(Math.round((enriched.length / records.length) * 100));
      setStats({ total: records.length, success: successCount, failed: failedCount });

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < records.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setIsProcessing(false);
    toast({
      title: 'Processing complete',
      description: `Successfully processed ${successCount} of ${records.length} ABNs`,
    });
  };

  const downloadCSV = () => {
    if (enrichedRecords.length === 0) return;

    const csv = Papa.unparse(enrichedRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `abn-check-results-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const downloadExcel = () => {
    if (enrichedRecords.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(enrichedRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ABN Results');
    XLSX.writeFile(workbook, `abn-check-results-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6" />
            ABN Checker
          </CardTitle>
          <CardDescription>
            Upload a CSV or Excel file with ABNs to verify GST registration status and retrieve business details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload File</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
              {file && (
                <div className="text-sm text-muted-foreground">
                  {file.name} ({records.length} records)
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              File must contain an "ABN" column. Optional: "GST Registered" column.
            </p>
          </div>

          {/* Process Button */}
          {records.length > 0 && !isProcessing && enrichedRecords.length === 0 && (
            <Button onClick={processABNs} className="w-full" size="lg">
              <Upload className="w-4 h-4 mr-2" />
              Process {records.length} ABNs
            </Button>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Processing ABNs...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Total: {stats.total}</span>
                <span className="text-green-600">Success: {stats.success}</span>
                <span className="text-red-600">Failed: {stats.failed}</span>
              </div>
            </div>
          )}

          {/* Results Summary */}
          {enrichedRecords.length > 0 && !isProcessing && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Processing complete! {stats.success} successful lookups, {stats.failed} failed.
              </AlertDescription>
            </Alert>
          )}

          {/* Download Buttons */}
          {enrichedRecords.length > 0 && !isProcessing && (
            <div className="flex gap-3">
              <Button onClick={downloadCSV} variant="secondary" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
              <Button onClick={downloadExcel} variant="secondary" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download Excel
              </Button>
            </div>
          )}

          {/* Results Preview */}
          {enrichedRecords.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Preview (first 5 results)</h3>
              <div className="border rounded-lg overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">ABN</th>
                      <th className="p-2 text-left">Entity Name</th>
                      <th className="p-2 text-left">GST</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedRecords.slice(0, 5).map((record, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 font-mono text-xs">{record.abn}</td>
                        <td className="p-2">{record.entityName || '-'}</td>
                        <td className="p-2">
                          {record.lookupStatus === 'success' ? (
                            record.gstRegistered ? (
                              <span className="text-green-600">✓ Yes</span>
                            ) : (
                              <span className="text-red-600">✗ No</span>
                            )
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-2">
                          {record.lookupStatus === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Info Box */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>How it works:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Upload a CSV or Excel file with an "ABN" column</li>
                <li>Click "Process ABNs" to verify each ABN with ABR</li>
                <li>Download enriched results with GST status, business names, and addresses</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
