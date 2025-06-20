import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RotateCcw, Check, X } from 'lucide-react';

interface ImageCropProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedImage: string) => void;
  imageUrl: string;
}

export const ImageCrop: React.FC<ImageCropProps> = ({
  isOpen,
  onClose,
  onCrop,
  imageUrl
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [scale, setScale]= useState([1]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate dimensions to fit image in canvas while maintaining aspect ratio
    const containerWidth = 400;
    const containerHeight = 400;
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const containerAspect = containerWidth / containerHeight;
    
    let displayWidth, displayHeight;
    if (imageAspect > containerAspect) {
      displayWidth = containerWidth * scale[0];
      displayHeight = (containerWidth / imageAspect) * scale[0];
    } else {
      displayHeight = containerHeight * scale[0];
      displayWidth = (containerHeight * imageAspect) * scale[0];
    }

    // Center the image
    const x = (containerWidth - displayWidth) / 2 + crop.x;
    const y = (containerHeight - displayHeight) / 2 + crop.y;

    // Draw image
    ctx.drawImage(image, x, y, displayWidth, displayHeight);
    
    // Create dark overlay everywhere
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Use composite operation to "cut out" the crop area from the dark overlay
    ctx.globalCompositeOperation = 'destination-out';
    const cropSize = 200;
    const cropX = (containerWidth - cropSize) / 2;
    const cropY = (containerHeight - cropSize) / 2;
    ctx.beginPath();
    ctx.arc(cropX + cropSize / 2, cropY + cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset composite operation and redraw the image in the crop area only
    ctx.globalCompositeOperation = 'source-atop';
    ctx.drawImage(image, x, y, displayWidth, displayHeight);
    
    // Reset composite operation for the border
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw crop circle border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cropX + cropSize / 2, cropY + cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [crop, scale, imageLoaded]);

  React.useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - crop.x,
      y: e.clientY - crop.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setCrop({
      ...crop,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    const cropSize = 200;
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;

    // Calculate the crop area on the original image
    const containerWidth = 400;
    const containerHeight = 400;
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const containerAspect = containerWidth / containerHeight;
    
    let displayWidth, displayHeight;
    if (imageAspect > containerAspect) {
      displayWidth = containerWidth * scale[0];
      displayHeight = (containerWidth / imageAspect) * scale[0];
    } else {
      displayHeight = containerHeight * scale[0];
      displayWidth = (containerHeight * imageAspect) * scale[0];
    }

    const x = (containerWidth - displayWidth) / 2 + crop.x;
    const y = (containerHeight - displayHeight) / 2 + crop.y;
    
    const scaleX = image.naturalWidth / displayWidth;
    const scaleY = image.naturalHeight / displayHeight;
    
    const cropX = (containerWidth - cropSize) / 2;
    const cropY = (containerHeight - cropSize) / 2;
    
    const sourceX = (cropX - x) * scaleX;
    const sourceY = (cropY - y) * scaleY;
    const sourceSize = cropSize * scaleX;

    // Create circular clip
    cropCtx.beginPath();
    cropCtx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    cropCtx.clip();

    // Draw the cropped portion
    cropCtx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      cropSize,
      cropSize
    );

    const croppedDataUrl = cropCanvas.toDataURL('image/png');
    onCrop(croppedDataUrl);
    onClose();
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0, width: 200, height: 200 });
    setScale([1]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crop Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="border rounded-lg cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="hidden"
              onLoad={() => setImageLoaded(true)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Zoom</Label>
            <Slider
              value={scale}
              onValueChange={setScale}
              min={0.5}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={resetCrop} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleCrop} className="flex-1 professional-button">
              <Check className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
