/**
 * ImageEditorModal - Modal wrapper for the Filerobot Image Editor
 *
 * Provides a dialog-based interface for image editing, replacing the
 * old ImageCrop and EventImageCrop components.
 */

import React, { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageEditor, type SavedImageData, type DesignState } from '@/components/ui/ImageEditor';

interface ImageEditorModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Called when user saves the edited image */
  onSave: (imageDataUrl: string, blob?: Blob) => void;
  /** Image URL or base64 to edit */
  imageUrl: string;
  /** Title for the modal */
  title?: string;
  /** Aspect ratio preset */
  aspectRatio?: 'avatar' | 'banner' | 'free';
  /** Output image quality (0-1) */
  quality?: number;
  /** Output format */
  format?: 'jpeg' | 'png' | 'webp';
  /** Modal max width class */
  maxWidthClass?: string;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  imageUrl,
  title = 'Edit Image',
  aspectRatio = 'free',
  quality = 0.92,
  format = 'jpeg',
  maxWidthClass = 'sm:max-w-4xl',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle save from the editor
  const handleSave = useCallback(
    async (savedImageData: SavedImageData, _designState: DesignState) => {
      setIsProcessing(true);
      try {
        // Get the image data URL
        let imageDataUrl: string;
        let blob: Blob | undefined;

        if (savedImageData.imageBase64) {
          // Use the base64 data directly
          imageDataUrl = savedImageData.imageBase64;

          // Convert base64 to blob for upload
          const base64Data = savedImageData.imageBase64.split(',')[1];
          if (base64Data) {
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: savedImageData.mimeType });
          }
        } else if (savedImageData.imageCanvas) {
          // Convert canvas to data URL and blob
          imageDataUrl = savedImageData.imageCanvas.toDataURL(
            savedImageData.mimeType,
            quality
          );

          // Get blob from canvas
          blob = await new Promise<Blob | undefined>((resolve) => {
            savedImageData.imageCanvas?.toBlob(
              (b) => resolve(b || undefined),
              savedImageData.mimeType,
              quality
            );
          });
        } else {
          console.error('No image data available from editor');
          setIsProcessing(false);
          return;
        }

        // Call the save callback
        onSave(imageDataUrl, blob);
        onClose();
      } catch (error) {
        console.error('Error processing saved image:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [onSave, onClose, quality]
  );

  // Handle close
  const handleClose = useCallback(() => {
    if (!isProcessing) {
      onClose();
    }
  }, [onClose, isProcessing]);

  // Set title based on aspect ratio if not provided
  const displayTitle = title || (
    aspectRatio === 'avatar'
      ? 'Edit Profile Picture'
      : aspectRatio === 'banner'
      ? 'Edit Banner Image'
      : 'Edit Image'
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={`${maxWidthClass} bg-slate-900 border-slate-700 p-0 overflow-hidden`}
        style={{ maxHeight: '90vh' }}
      >
        <DialogHeader className="px-6 py-4 border-b border-slate-700">
          <DialogTitle className="text-white">{displayTitle}</DialogTitle>
        </DialogHeader>

        <div className="relative" style={{ height: '70vh', minHeight: '500px' }}>
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-50">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-sm">Processing image...</span>
              </div>
            </div>
          )}

          {imageUrl && (
            <ImageEditor
              source={imageUrl}
              onSave={handleSave}
              onClose={handleClose}
              aspectRatio={aspectRatio}
              quality={quality}
              format={format}
              height="100%"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Legacy-compatible wrapper for ImageCrop replacement
interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedImage: string) => void;
  imageUrl: string;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  onCrop,
  imageUrl,
}) => {
  const handleSave = useCallback(
    (imageDataUrl: string) => {
      onCrop(imageDataUrl);
    },
    [onCrop]
  );

  return (
    <ImageEditorModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      imageUrl={imageUrl}
      title="Crop Profile Picture"
      aspectRatio="avatar"
      format="png"
      quality={0.95}
    />
  );
};

// Legacy-compatible wrapper for EventImageCrop replacement
interface EventImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedImage: string) => void;
  imageUrl: string;
}

export const EventImageCropModal: React.FC<EventImageCropModalProps> = ({
  isOpen,
  onClose,
  onCrop,
  imageUrl,
}) => {
  const handleSave = useCallback(
    (imageDataUrl: string) => {
      onCrop(imageDataUrl);
    },
    [onCrop]
  );

  return (
    <ImageEditorModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      imageUrl={imageUrl}
      title="Edit Event Banner"
      aspectRatio="banner"
      format="jpeg"
      quality={0.92}
      maxWidthClass="sm:max-w-5xl"
    />
  );
};

export default ImageEditorModal;
