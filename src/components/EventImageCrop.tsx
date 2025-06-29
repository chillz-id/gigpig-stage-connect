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
  const FINAL_WIDTH = 1920;
  const FINAL_HEIGHT = 1080;

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
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !imageLoaded) {
      console.error('Canvas, image, or imageLoaded not available for cropping');
      return;
    }

    try {
      const cropCanvas = document.createElement('canvas');
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) {
        console.error('Could not get 2D context for crop canvas');
        return;
      }

      // Set final dimensions to exact banner size
      cropCanvas.width = FINAL_WIDTH;
      cropCanvas.height = FINAL_HEIGHT;

      // Calculate display dimensions
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

      // Calculate positions
      const imageX = (containerWidth - displayWidth) / 2 + crop.x;
      const imageY = (containerHeight - displayHeight) / 2 + crop.y;
      const cropX = (containerWidth - CROP_WIDTH) / 2;
      const cropY = (containerHeight - CROP_HEIGHT) / 2;
      
      // Calculate what portion of the original image to use
      const scaleFactorX = image.naturalWidth / displayWidth;
      const scaleFactorY = image.naturalHeight / displayHeight;
      
      // Find the intersection of the crop area with the displayed image
      const intersectionLeft = Math.max(cropX, imageX);
      const intersectionTop = Math.max(cropY, imageY);
      const intersectionRight = Math.min(cropX + CROP_WIDTH, imageX + displayWidth);
      const intersectionBottom = Math.min(cropY + CROP_HEIGHT, imageY + displayHeight);
      
      const intersectionWidth = intersectionRight - intersectionLeft;
      const intersectionHeight = intersectionBottom - intersectionTop;
      
      if (intersectionWidth <= 0 || intersectionHeight <= 0) {
        console.error('No intersection between crop area and image');
        return;
      }
      
      // Map back to source image coordinates
      const sourceX = (intersectionLeft - imageX) * scaleFactorX;
      const sourceY = (intersectionTop - imageY) * scaleFactorY;
      const sourceWidth = intersectionWidth * scaleFactorX;
      const sourceHeight = intersectionHeight * scaleFactorY;
      
      // Calculate destination coordinates on the crop canvas
      const destX = (intersectionLeft - cropX) * (FINAL_WIDTH / CROP_WIDTH);
      const destY = (intersectionTop - cropY) * (FINAL_HEIGHT / CROP_HEIGHT);
      const destWidth = intersectionWidth * (FINAL_WIDTH / CROP_WIDTH);
      const destHeight = intersectionHeight * (FINAL_HEIGHT / CROP_HEIGHT);


      // Fill with black background first (in case image doesn't cover full area)
      cropCtx.fillStyle = '#000000';
      cropCtx.fillRect(0, 0, FINAL_WIDTH, FINAL_HEIGHT);

      // Draw the cropped portion
      cropCtx.drawImage(
        image,
        sourceX, sourceY, sourceWidth, sourceHeight,
        destX, destY, destWidth, destHeight
      );

      // Export as high quality JPEG
      try {
        const croppedDataUrl = cropCanvas.toDataURL('image/jpeg', 0.95);
        onCrop(croppedDataUrl);
      } catch (corsError) {
        console.error('CORS error, trying blob approach:', corsError);
        cropCanvas.toBlob((blob) => {
          if (blob) {
            const objectUrl = URL.createObjectURL(blob);
            onCrop(objectUrl);
          } else {
            console.error('Failed to create blob');
            onCrop(imageUrl);
          }
        }, 'image/jpeg', 0.95);
      }
    } catch (error) {
      console.error('Error during cropping process:', error);
    }
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setScale([1]);
  };

  const handleImageLoad = () => {
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
