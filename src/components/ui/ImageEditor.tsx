/**
 * ImageEditor - Filerobot Image Editor wrapper component
 *
 * Full-featured image editor with crop, rotate, flip, filters, annotations, and more.
 * Wraps react-filerobot-image-editor while preserving the same external API
 * used by all consumer components.
 */

import React, { useCallback, useRef, useState } from 'react';
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor';
import type { getCurrentImgDataFunction } from 'react-filerobot-image-editor';

// Type definitions matching the original API
interface DesignState {
  [key: string]: unknown;
}

interface SavedImageData {
  name: string;
  extension: string;
  mimeType: string;
  fullName: string;
  height: number;
  width: number;
  imageBase64?: string;
  imageCanvas?: HTMLCanvasElement;
  quality?: number;
}

interface ImageEditorProps {
  /** Image URL or base64 to edit */
  source: string;
  /** Called when user saves the edited image */
  onSave: (imageData: SavedImageData, designState: DesignState) => void;
  /** Called when user closes without saving */
  onClose?: () => void;
  /** Optional initial design state to restore */
  designState?: DesignState;
  /** Aspect ratio preset - 'avatar' (1:1), 'banner' (16:9), 'free' (no constraint) */
  aspectRatio?: 'avatar' | 'banner' | 'free';
  /** Whether to show save and close buttons */
  showActions?: boolean;
  /** Default tab to show on open (empty string = no tab open) */
  defaultTab?: 'crop' | 'flip' | 'rotate' | 'draw' | 'shape' | 'text' | 'filter' | '';
  /** Editor height */
  height?: string | number;
  /** Output image quality (0-1) */
  quality?: number;
  /** Output format */
  format?: 'jpeg' | 'png' | 'webp';
}

// Get max dimensions for output based on aspect ratio type
function getMaxDimensions(aspectRatio: string) {
  switch (aspectRatio) {
    case 'avatar':
      return { width: 400, height: 400 };
    case 'banner':
      return { width: 1920, height: 1080 };
    default:
      return { width: 1920, height: 1080 };
  }
}

// Resize image via canvas if it exceeds max dimensions
function resizeIfNeeded(
  base64: string,
  currentWidth: number,
  currentHeight: number,
  maxDims: { width: number; height: number },
  mimeType: string,
  quality: number,
): Promise<{ base64: string; width: number; height: number }> {
  const needsResize = currentWidth > maxDims.width || currentHeight > maxDims.height;

  if (!needsResize) {
    return Promise.resolve({ base64, width: currentWidth, height: currentHeight });
  }

  const scale = Math.min(maxDims.width / currentWidth, maxDims.height / currentHeight);
  const newWidth = Math.round(currentWidth * scale);
  const newHeight = Math.round(currentHeight * scale);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        resolve({
          base64: canvas.toDataURL(mimeType, quality),
          width: newWidth,
          height: newHeight,
        });
      } else {
        resolve({ base64, width: currentWidth, height: currentHeight });
      }
    };
    img.onerror = () => {
      resolve({ base64, width: currentWidth, height: currentHeight });
    };
    img.src = base64;
  });
}

// Map old defaultTab values to Filerobot tab IDs
function mapDefaultTab(tab: string): typeof TABS[keyof typeof TABS] | undefined {
  switch (tab) {
    case 'crop':
    case 'flip':
    case 'rotate':
      return TABS.ADJUST;
    case 'draw':
    case 'shape':
    case 'text':
      return TABS.ANNOTATE;
    case 'filter':
      return TABS.FILTERS;
    default:
      return undefined;
  }
}

// Map old defaultTab to Filerobot tool ID
function mapDefaultTool(tab: string): typeof TOOLS[keyof typeof TOOLS] | undefined {
  switch (tab) {
    case 'crop':
      return TOOLS.CROP;
    case 'flip':
      return TOOLS.FLIP_X;
    case 'rotate':
      return TOOLS.ROTATE;
    case 'draw':
      return TOOLS.PEN;
    case 'shape':
      return TOOLS.RECT;
    case 'text':
      return TOOLS.TEXT;
    default:
      return undefined;
  }
}

export const ToastUIImageEditor: React.FC<ImageEditorProps> = ({
  source,
  onSave,
  onClose,
  aspectRatio = 'free',
  defaultTab = '',
  height = '600px',
  quality = 0.92,
  format = 'jpeg',
}) => {
  const getCurrentImgDataRef = useRef<getCurrentImgDataFunction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const heightValue = typeof height === 'number' ? `${height}px` : height;
  const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  const maxDims = getMaxDimensions(aspectRatio);

  // Build crop config
  const cropConfig = {
    presetsItems: [
      { titleKey: 'Avatar (1:1)', ratio: 1, icon: undefined as undefined },
      { titleKey: 'Banner (16:9)', ratio: 16 / 9, icon: undefined as undefined },
      { titleKey: 'Landscape (4:3)', ratio: 4 / 3, icon: undefined as undefined },
      { titleKey: 'Portrait (3:4)', ratio: 3 / 4, icon: undefined as undefined },
    ],
    ratio: aspectRatio === 'avatar' ? 1 : aspectRatio === 'banner' ? 16 / 9 : ('custom' as const),
    autoResize: false,
  };

  // Intercept Filerobot's save to apply our resize logic
  const handleBeforeSave = useCallback(() => {
    // Return false to prevent Filerobot's built-in save dialog
    return false;
  }, []);

  // Handle save via Filerobot's onSave callback
  const handleFilerobotSave = useCallback(
    async (
      savedData: { imageBase64?: string; imageCanvas?: HTMLCanvasElement; width?: number; height?: number; fullName?: string },
      designState: Record<string, unknown>,
    ) => {
      setIsProcessing(true);
      try {
        const extension = format;
        let imageBase64 = savedData.imageBase64 || '';
        let imgWidth = savedData.width || 0;
        let imgHeight = savedData.height || 0;

        // If we have a canvas but no base64, convert it
        if (!imageBase64 && savedData.imageCanvas) {
          imageBase64 = savedData.imageCanvas.toDataURL(mimeType, quality);
          imgWidth = savedData.imageCanvas.width;
          imgHeight = savedData.imageCanvas.height;
        }

        if (!imageBase64) {
          console.error('No image data available from editor');
          return;
        }

        // Apply auto-resize
        const resized = await resizeIfNeeded(imageBase64, imgWidth, imgHeight, maxDims, mimeType, quality);

        const result: SavedImageData = {
          name: 'edited-image',
          extension,
          mimeType,
          fullName: `edited-image.${extension}`,
          height: resized.height,
          width: resized.width,
          imageBase64: resized.base64,
          quality,
        };

        onSave(result, designState as DesignState);
      } finally {
        setIsProcessing(false);
      }
    },
    [format, mimeType, quality, maxDims, onSave],
  );

  // Custom save using getCurrentImgData ref
  const handleCustomSave = useCallback(async () => {
    if (!getCurrentImgDataRef.current) return;

    setIsProcessing(true);
    try {
      const { imageData, designState, hideLoadingSpinner } = getCurrentImgDataRef.current(
        {
          name: 'edited-image',
          extension: format,
          quality,
        },
        4, // pixel ratio for quality
        true, // keep loading spinner
      );

      let imageBase64 = imageData.imageBase64 || '';
      let imgWidth = imageData.width || 0;
      let imgHeight = imageData.height || 0;

      if (!imageBase64 && imageData.imageCanvas) {
        imageBase64 = imageData.imageCanvas.toDataURL(mimeType, quality);
        imgWidth = imageData.imageCanvas.width;
        imgHeight = imageData.imageCanvas.height;
      }

      hideLoadingSpinner();

      if (!imageBase64) {
        console.error('No image data available from editor');
        return;
      }

      const resized = await resizeIfNeeded(imageBase64, imgWidth, imgHeight, maxDims, mimeType, quality);

      const result: SavedImageData = {
        name: 'edited-image',
        extension: format,
        mimeType,
        fullName: `edited-image.${format}`,
        height: resized.height,
        width: resized.width,
        imageBase64: resized.base64,
        quality,
      };

      onSave(result, designState as DesignState);
    } finally {
      setIsProcessing(false);
    }
  }, [format, mimeType, quality, maxDims, onSave]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const defaultTabId = defaultTab ? mapDefaultTab(defaultTab) : TABS.ADJUST;
  const defaultToolId = defaultTab ? mapDefaultTool(defaultTab) : TOOLS.CROP;

  return (
    <div className="filerobot-image-editor-container relative" style={{ height: heightValue }}>
      <style>{`
        /* Match dark theme and purple accents */
        .FIE_root {
          font-family: Inter, system-ui, sans-serif !important;
          height: 100% !important;
        }
        /* Ensure editor fills container */
        .FIE_root > div {
          height: 100% !important;
        }
      `}</style>

      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm">Processing image...</span>
          </div>
        </div>
      )}

      <FilerobotImageEditor
        source={source}
        tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.FILTERS, TABS.WATERMARK, TABS.RESIZE]}
        defaultTabId={defaultTabId}
        defaultToolId={defaultToolId}
        defaultSavedImageName="edited-image"
        defaultSavedImageType={format === 'webp' ? 'png' : format}
        defaultSavedImageQuality={quality}
        onBeforeSave={handleBeforeSave}
        onSave={handleFilerobotSave}
        onClose={handleClose}
        closeAfterSave={false}
        avoidChangesNotSavedAlertOnLeave
        savingPixelRatio={4}
        previewPixelRatio={window.devicePixelRatio || 1}
        Crop={cropConfig}
        Rotate={{ componentType: 'slider' }}
        observePluginContainerSize
        showBackButton
        getCurrentImgDataFnRef={getCurrentImgDataRef as React.RefObject<getCurrentImgDataFunction>}
        theme={{
          palette: {
            'bg-secondary': '#1e1e2e',
            'bg-primary': '#181825',
            'bg-primary-active': '#313244',
            'accent-primary': '#9333ea',
            'accent-primary-active': '#7c3aed',
            'icons-primary': '#cdd6f4',
            'icons-secondary': '#a6adc8',
            'borders-secondary': '#45475a',
            'borders-primary': '#585b70',
            'borders-strong': '#6c7086',
            'light-shadow': 'rgba(0, 0, 0, 0.3)',
            'warning': '#f9e2af',
          },
          typography: {
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        }}
      />

      {/* Custom action buttons - overlaid on editor */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-20">
        {onClose && (
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleCustomSave}
          disabled={isProcessing}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
};

// Export with the same name for backward compatibility
export { ToastUIImageEditor as ImageEditor };
export default ToastUIImageEditor;
export type { ImageEditorProps, SavedImageData, DesignState };
