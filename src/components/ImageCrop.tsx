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
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 300, height: 300 });
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

    // Clear canvas with a neutral background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions to fit image in canvas while maintaining aspect ratio
    const containerWidth = 600;
    const containerHeight = 600;
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

    // Define the crop circle (increased from 200 to 300 for better visibility)
    const cropSize = 300;
    const cropX = (containerWidth - cropSize) / 2;
    const cropY = (containerHeight - cropSize) / 2;
    
    // Create temporary canvas for the overlay
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;
    const overlayCtx = overlayCanvas.getContext('2d');
    
    if (overlayCtx) {
      // Draw dark overlay on temporary canvas
      overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      
      // Cut out the circle
      overlayCtx.globalCompositeOperation = 'destination-out';
      overlayCtx.beginPath();
      overlayCtx.arc(cropX + cropSize / 2, cropY + cropSize / 2, cropSize / 2, 0, Math.PI * 2);
      overlayCtx.fill();
    }
    
    // Draw the full image on main canvas
    ctx.drawImage(image, x, y, displayWidth, displayHeight);
    
    // Draw the overlay with cutout on top
    ctx.drawImage(overlayCanvas, 0, 0);
    
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

    const cropSize = 300;
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;

    // Calculate the crop area on the original image
    const containerWidth = 600;
    const containerHeight = 600;
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
    setCrop({ x: 0, y: 0, width: 300, height: 300 });
    setScale([1]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crop Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              className="border rounded-lg cursor-move w-full"
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
            <Button onClick={resetCrop} className="professional-button flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={onClose} className="professional-button flex-1">
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
