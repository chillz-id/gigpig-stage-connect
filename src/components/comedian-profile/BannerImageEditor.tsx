/**
 * BannerImageEditor - Comedian profile banner editor
 *
 * Now uses Filerobot Image Editor for full editing capabilities:
 * - Crop with 8:3 aspect ratio (banner format)
 * - Rotate and flip
 * - Brightness, contrast, saturation adjustments
 * - Filters
 * - Annotations (draw, text, shapes)
 *
 * MIGRATION NOTE: This component now outputs cropped image data instead of
 * position coordinates. Parent components should update to handle the new
 * onSave signature: (imageDataUrl: string, blob?: Blob) => void
 */

import React, { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageEditor, type SavedImageData, type DesignState } from '@/components/ui/ImageEditor';

// Legacy interface for backward compatibility
interface LegacyBannerImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (position: { x: number; y: number; scale: number }) => void;
  imageUrl: string;
  initialPosition?: { x: number; y: number; scale: number };
}

// New interface with image data output
interface ModernBannerImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSave: (imageDataUrl: string, blob?: Blob) => void;
  imageUrl: string;
}

type BannerImageEditorProps = LegacyBannerImageEditorProps | ModernBannerImageEditorProps;

// Type guard to check which interface is being used
function isModernProps(props: BannerImageEditorProps): props is ModernBannerImageEditorProps {
  return 'onImageSave' in props;
}

export const BannerImageEditor: React.FC<BannerImageEditorProps> = (props) => {
  const { isOpen, onClose, imageUrl } = props;
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = useCallback(
    async (savedImageData: SavedImageData, _designState: DesignState) => {
      setIsProcessing(true);
      try {
        let imageDataUrl: string;
        let blob: Blob | undefined;

        if (savedImageData.imageBase64) {
          imageDataUrl = savedImageData.imageBase64;

          // Convert base64 to blob
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
          imageDataUrl = savedImageData.imageCanvas.toDataURL(
            savedImageData.mimeType,
            0.92
          );

          blob = await new Promise<Blob | undefined>((resolve) => {
            savedImageData.imageCanvas?.toBlob(
              (b) => resolve(b || undefined),
              savedImageData.mimeType,
              0.92
            );
          });
        } else {
          console.error('No image data available from editor');
          setIsProcessing(false);
          return;
        }

        // Handle based on interface type
        if (isModernProps(props)) {
          props.onImageSave(imageDataUrl, blob);
        } else {
          // Legacy mode: Call onSave with dummy position since we now crop directly
          // The parent component should be updated to use onImageSave instead
          console.warn(
            'BannerImageEditor: Using legacy onSave interface. Consider migrating to onImageSave for better functionality.'
          );
          // Return center position as default
          props.onSave({ x: 0, y: 0, scale: 1 });
        }

        onClose();
      } catch (error) {
        console.error('Error processing saved image:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [props, onClose]
  );

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      onClose();
    }
  }, [onClose, isProcessing]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-5xl bg-slate-900 border-slate-700 p-0 overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        <DialogHeader className="px-6 py-4 border-b border-slate-700">
          <DialogTitle className="text-white">Edit Banner Image</DialogTitle>
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
              aspectRatio="banner"
              quality={0.92}
              format="jpeg"
              height="100%"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BannerImageEditor;
