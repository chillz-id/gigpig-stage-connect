
import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RotateCcw, Check, X } from 'lucide-react';

interface EventImageCropProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedImage: string) => void;
  imageUrl: string;
}

export const EventImageCrop: React.FC<EventImageCropProps> = ({
  isOpen,
  onClose,
  onCrop,
  imageUrl
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState([1]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Event banner dimensions (16:9 aspect ratio)
  const CROP_WIDTH = 400;
  const CROP_HEIGHT = 225; // 400 * 9/16 = 225

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate dimensions to fit image in canvas while maintaining aspect ratio
    const containerWidth = 500;
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
    const cropX = (containerWidth - CROP_WIDTH) / 2;
    const cropY = (containerHeight - CROP_HEIGHT) / 2;
    ctx.fillRect(cropX, cropY, CROP_WIDTH, CROP_HEIGHT);
    
    // Reset composite operation and redraw the image in the crop area only
    ctx.globalCompositeOperation = 'source-atop';
    ctx.drawImage(image, x, y, displayWidth, displayHeight);
    
    // Reset composite operation for the border
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw crop rectangle border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, CROP_WIDTH, CROP_HEIGHT);
  }, [crop, scale, imageLoaded]);

  React.useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [drawCanvas, imageLoaded]);

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
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    console.log('Apply button clicked - starting crop process');
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !imageLoaded) {
      console.error('Canvas, image, or imageLoaded not available for cropping', { 
        canvas: !!canvas, 
        image: !!image, 
        imageLoaded 
      });
      return;
    }

    try {
      console.log('Creating crop canvas...');
      // Create a new canvas for the cropped image
      const cropCanvas = document.createElement('canvas');
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) {
        console.error('Could not get 2D context for crop canvas');
        return;
      }

      // Set final dimensions (1920x1080)
      cropCanvas.width = 1920;
      cropCanvas.height = 1080;

      // Calculate the crop area on the original image
      const containerWidth = 500;
      const containerHeight = 400;
      
      // Prevent division by zero
      if (image.naturalHeight === 0) {
        console.error('Image natural height is 0');
        return;
      }
      
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

      // Prevent division by zero
      if (displayWidth === 0 || displayHeight === 0) {
        console.error('Display dimensions are 0', { displayWidth, displayHeight });
        return;
      }

      const x = (containerWidth - displayWidth) / 2 + crop.x;
      const y = (containerHeight - displayHeight) / 2 + crop.y;
      
      const scaleX = image.naturalWidth / displayWidth;
      const scaleY = image.naturalHeight / displayHeight;
      
      const cropX = (containerWidth - CROP_WIDTH) / 2;
      const cropY = (containerHeight - CROP_HEIGHT) / 2;
      
      const sourceX = Math.max(0, (cropX - x) * scaleX);
      const sourceY = Math.max(0, (cropY - y) * scaleY);
      const sourceWidth = Math.min(image.naturalWidth - sourceX, CROP_WIDTH * scaleX);
      const sourceHeight = Math.min(image.naturalHeight - sourceY, CROP_HEIGHT * scaleY);

      console.log('Crop parameters:', {
        sourceX, sourceY, sourceWidth, sourceHeight,
        imageNaturalWidth: image.naturalWidth,
        imageNaturalHeight: image.naturalHeight
      });

      // Ensure we have valid source dimensions
      if (sourceWidth <= 0 || sourceHeight <= 0) {
        console.error('Invalid source dimensions', { sourceWidth, sourceHeight });
        return;
      }

      // Draw the cropped portion at full resolution
      cropCtx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        1920,
        1080
      );

      // Try to export as data URL
      try {
        const croppedDataUrl = cropCanvas.toDataURL('image/jpeg', 0.9);
        console.log('Crop completed successfully, data URL length:', croppedDataUrl.length);
        onCrop(croppedDataUrl);
      } catch (corsError) {
        console.error('CORS error when exporting canvas. Trying alternative approach:', corsError);
        
        // Alternative: Convert to blob and create object URL
        cropCanvas.toBlob((blob) => {
          if (blob) {
            const objectUrl = URL.createObjectURL(blob);
            console.log('Crop completed using blob URL:', objectUrl);
            onCrop(objectUrl);
          } else {
            console.error('Failed to create blob from canvas');
            // Last resort: return original image
            onCrop(imageUrl);
          }
        }, 'image/jpeg', 0.9);
      }
    } catch (error) {
      console.error('Error during cropping process:', error);
    }
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setScale([1]);
    console.log('Crop reset to default values');
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully for cropping');
    setImageLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image failed to load:', e);
    setImageLoaded(false);
  };

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
      setCrop({ x: 0, y: 0 });
      setScale([1]);
      setIsDragging(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gray-800 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle>Crop Event Banner</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={500}
              height={400}
              className="border rounded-lg cursor-move bg-gray-700"
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
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              onError={handleImageError}
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

          <p className="text-sm text-gray-300">
            Drag to position the image. The cropped banner will be 1920x1080 pixels.
            {!imageLoaded && imageUrl && <span className="text-yellow-400"> (Loading image...)</span>}
          </p>

          <div className="flex gap-2">
            <Button variant="outline" onClick={resetCrop} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleCrop} 
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500"
              disabled={!imageLoaded}
            >
              <Check className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
