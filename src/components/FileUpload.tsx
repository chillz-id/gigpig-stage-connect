
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image, File } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  bucket: 'event-media' | 'profile-images';
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
  onUploadComplete?: (url: string) => void;
  className?: string;
  children?: React.ReactNode;
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  bucket,
  folder,
  maxSize,
  allowedTypes,
  onUploadComplete,
  className,
  children,
  multiple = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  const { uploadFile, uploading, uploadProgress } = useFileUpload({
    bucket,
    folder,
    maxSize,
    allowedTypes
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const filesToProcess = multiple ? fileArray : [fileArray[0]];

    for (const file of filesToProcess) {
      const url = await uploadFile(file);
      if (url) {
        setUploadedFiles(prev => [...prev, url]);
        onUploadComplete?.(url);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (children) {
    return (
      <div onClick={openFileSelector} className={cn("cursor-pointer", className)}>
        {children}
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes?.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer hover:border-primary/50",
          dragActive ? "border-primary bg-primary/5" : "border-border",
          uploading && "pointer-events-none opacity-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {uploading ? 'Uploading...' : 'Upload Files'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop files here, or click to select files
              </p>
              
              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress}% complete
                  </p>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                {allowedTypes && (
                  <p>Supported formats: {allowedTypes.join(', ')}</p>
                )}
                {maxSize && (
                  <p>Maximum size: {Math.round(maxSize / 1024 / 1024)}MB</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={allowedTypes?.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />

      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files:</h4>
          <div className="grid grid-cols-1 gap-2">
            {uploadedFiles.map((url, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <div className="w-8 h-8 bg-background rounded flex items-center justify-center">
                  {url.includes('image') ? (
                    <Image className="w-4 h-4" />
                  ) : (
                    <File className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm truncate flex-1">{url.split('/').pop()}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
