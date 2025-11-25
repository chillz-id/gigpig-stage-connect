import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check, X } from 'lucide-react';

interface BannerImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (position: { x: number; y: number; scale: number }) => void;
  imageUrl: string;
  initialPosition?: { x: number; y: number; scale: number };
}

export const BannerImageEditor: React.FC<BannerImageEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  imageUrl,
  initialPosition = { x: 0, y: 0, scale: 1 },
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(1); // Locked to minScale, no zoom allowed
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Calculate bounds for repositioning (constrain to viewport)
  const calculateBounds = useCallback(() => {
    if (imageDimensions.width === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const containerWidth = 1200;
    const containerHeight = 450; // 8:3 aspect ratio (75% of previous 600px height)
    const scaledWidth = imageDimensions.width * scale;
    const scaledHeight = imageDimensions.height * scale;

    // Calculate valid range for x and y
    // If image is larger than container, allow negative positioning up to the overflow
    // If image is smaller, keep it at 0
    const minX = scaledWidth > containerWidth ? -(scaledWidth - containerWidth) : 0;
    const maxX = 0;
    const minY = scaledHeight > containerHeight ? -(scaledHeight - containerHeight) : 0;
    const maxY = 0;

    return { minX, maxX, minY, maxY };
  }, [imageDimensions, scale]);

  // Clamp position within bounds
  const clampPosition = useCallback((pos: { x: number; y: number }) => {
    const bounds = calculateBounds();
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, pos.x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, pos.y)),
    };
  }, [calculateBounds]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with a neutral background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Banner dimensions (8:3 aspect ratio)
    const containerWidth = 1200;
    const containerHeight = 450;

    // Scale image while maintaining aspect ratio
    const displayWidth = image.naturalWidth * scale;
    const displayHeight = image.naturalHeight * scale;

    // Position from top-left with clamped offset (Facebook-style)
    const x = position.x;
    const y = position.y;

    // Draw the full image on main canvas
    ctx.drawImage(image, x, y, displayWidth, displayHeight);

    // Draw crop frame outline with dashed line for better visibility
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(0, 0, containerWidth, containerHeight);
    ctx.setLineDash([]);

    // Draw corner handles (larger and more visible)
    const handleSize = 10;
    ctx.fillStyle = '#ffffff';
    // Top-left
    ctx.fillRect(0, 0, handleSize, handleSize);
    // Top-right
    ctx.fillRect(containerWidth - handleSize, 0, handleSize, handleSize);
    // Bottom-left
    ctx.fillRect(0, containerHeight - handleSize, handleSize, handleSize);
    // Bottom-right
    ctx.fillRect(containerWidth - handleSize, containerHeight - handleSize, handleSize, handleSize);
  }, [position, scale, imageLoaded]);

  React.useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Calculate minimum scale to fit container when image loads
  React.useEffect(() => {
    const image = imageRef.current;
    if (!image || !imageLoaded) return;

    // Capture image dimensions
    setImageDimensions({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });

    const containerWidth = 1200;
    const containerHeight = 450; // 8:3 aspect ratio
    // Minimum scale to ensure image covers the banner area
    const scaleToFitWidth = containerWidth / image.naturalWidth;
    const scaleToFitHeight = containerHeight / image.naturalHeight;
    const min = Math.max(scaleToFitWidth, scaleToFitHeight);

    // Lock scale to minimum - no zoom in or out allowed
    setScale(min);

    // Reclamp position after dimensions are set
    setPosition(prev => clampPosition(prev));
  }, [imageLoaded, clampPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    // Constrained dragging with bounds (Facebook-style)
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setPosition(clampPosition(newPosition));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    onSave({
      x: position.x,
      y: position.y,
      scale: scale,
    });
    onClose();
  };

  const resetPosition = () => {
    setPosition({ x: 0, y: 0 });
    // Scale stays locked at minimum, don't reset it
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Edit Banner Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={1200}
              height={450}
              className="border rounded-lg cursor-move w-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Banner preview"
              className="hidden"
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Drag to reposition the banner. The dashed outline shows the final crop area. Image is locked to cover the full banner area.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={resetPosition} className="professional-button flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={onClose} className="professional-button flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 professional-button">
              <Check className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
