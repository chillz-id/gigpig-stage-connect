
import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Upload, Link, Cloud } from 'lucide-react';
import { Label } from './label';

interface FileUploadProps {
  onFileSelect: (file: File | string) => void;
  className?: string;
  children?: React.ReactNode;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  className = "",
  children 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      setIsOpen(false);
    }
  };

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      onFileSelect(linkUrl.trim());
      setIsOpen(false);
      setLinkUrl('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className={`professional-button ${className}`}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Banner
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Event Banner</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-input">From Computer</Label>
            <Input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="link-input">From URL</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="link-input"
                placeholder="https://example.com/image.jpg"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <Button onClick={handleLinkSubmit} disabled={!linkUrl.trim()}>
                <Link className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Button className="professional-button w-full" disabled>
              <Cloud className="w-4 h-4 mr-2" />
              Google Drive (Coming Soon)
            </Button>
            <Button className="professional-button w-full" disabled>
              <Cloud className="w-4 h-4 mr-2" />
              Dropbox (Coming Soon)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
