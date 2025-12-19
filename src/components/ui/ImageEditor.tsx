/**
 * ImageEditor - Toast UI Image Editor wrapper component
 *
 * Full-featured image editor with crop, rotate, flip, filters, annotations, and more.
 * Uses the core tui-image-editor library directly for React 19 compatibility.
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';
import TuiImageEditor from 'tui-image-editor';
import 'tui-image-editor/dist/tui-image-editor.css';

// Type definitions for Toast UI Image Editor output
interface DesignState {
  // Toast UI design state - can be saved and restored
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

// Dark theme matching the app's design
const darkTheme = {
  'common.bi.image': '',
  'common.bisize.width': '0',
  'common.bisize.height': '0',
  'common.backgroundImage': 'none',
  'common.backgroundColor': '#1e1e2e',
  'common.border': '0px',

  // Header
  'header.backgroundImage': 'none',
  'header.backgroundColor': '#1e1e2e',
  'header.border': '0px',

  // Load button
  'loadButton.backgroundColor': '#9333ea',
  'loadButton.border': '1px solid #9333ea',
  'loadButton.color': '#fff',
  'loadButton.fontFamily': 'Inter, system-ui, sans-serif',
  'loadButton.fontSize': '14px',

  // Download button
  'downloadButton.backgroundColor': '#9333ea',
  'downloadButton.border': '1px solid #9333ea',
  'downloadButton.color': '#fff',
  'downloadButton.fontFamily': 'Inter, system-ui, sans-serif',
  'downloadButton.fontSize': '14px',

  // Menu
  'menu.normalIcon.color': '#a6adc8',
  'menu.activeIcon.color': '#9333ea',
  'menu.disabledIcon.color': '#45475a',
  'menu.hoverIcon.color': '#cdd6f4',
  'menu.iconSize.width': '24px',
  'menu.iconSize.height': '24px',

  // Submenu
  'submenu.backgroundColor': '#181825',
  'submenu.partition.color': '#45475a',

  'submenu.normalIcon.color': '#a6adc8',
  'submenu.activeIcon.color': '#9333ea',
  'submenu.iconSize.width': '32px',
  'submenu.iconSize.height': '32px',

  'submenu.normalLabel.color': '#a6adc8',
  'submenu.normalLabel.fontWeight': 'normal',
  'submenu.activeLabel.color': '#cdd6f4',
  'submenu.activeLabel.fontWeight': 'normal',

  // Checkbox
  'checkbox.border': '1px solid #45475a',
  'checkbox.backgroundColor': '#181825',

  // Range
  'range.pointer.color': '#9333ea',
  'range.bar.color': '#45475a',
  'range.subbar.color': '#9333ea',

  'range.disabledPointer.color': '#45475a',
  'range.disabledBar.color': '#313244',
  'range.disabledSubbar.color': '#45475a',

  'range.value.color': '#cdd6f4',
  'range.value.fontWeight': 'normal',
  'range.value.fontSize': '11px',
  'range.value.border': '1px solid #45475a',
  'range.value.backgroundColor': '#181825',
  'range.title.color': '#a6adc8',
  'range.title.fontWeight': 'lighter',

  // Colorpicker
  'colorpicker.button.border': '1px solid #45475a',
  'colorpicker.title.color': '#a6adc8',
};

// Custom locale for better UX
const customLocale = {
  ZoomIn: 'Zoom in',
  ZoomOut: 'Zoom out',
  Hand: 'Hand',
  History: 'History',
  Resize: 'Resize',
  Crop: 'Crop',
  DeleteAll: 'Delete all',
  Delete: 'Delete',
  Undo: 'Undo',
  Redo: 'Redo',
  Reset: 'Reset',
  Flip: 'Flip',
  Rotate: 'Rotate',
  Draw: 'Draw',
  Shape: 'Shape',
  Icon: 'Icon',
  Text: 'Text',
  Mask: 'Mask',
  Filter: 'Filter',
  Bold: 'Bold',
  Italic: 'Italic',
  Underline: 'Underline',
  Left: 'Left',
  Center: 'Center',
  Right: 'Right',
  Color: 'Color',
  'Text size': 'Text size',
  Custom: 'Custom',
  Square: 'Square',
  Apply: 'Apply',
  Cancel: 'Cancel',
  'Flip X': 'Flip X',
  'Flip Y': 'Flip Y',
  Range: 'Range',
  Stroke: 'Stroke',
  Fill: 'Fill',
  Circle: 'Circle',
  Triangle: 'Triangle',
  Rectangle: 'Rectangle',
  Free: 'Free',
  Straight: 'Straight',
  Arrow: 'Arrow',
  'Arrow-2': 'Arrow-2',
  'Arrow-3': 'Arrow-3',
  'Star-1': 'Star-1',
  'Star-2': 'Star-2',
  Polygon: 'Polygon',
  Location: 'Location',
  Heart: 'Heart',
  Bubble: 'Bubble',
  'Custom icon': 'Custom icon',
  'Load Mask Image': 'Load Mask Image',
  Grayscale: 'Grayscale',
  Blur: 'Blur',
  Sharpen: 'Sharpen',
  Emboss: 'Emboss',
  'Remove White': 'Remove White',
  Distance: 'Distance',
  Brightness: 'Brightness',
  Noise: 'Noise',
  'Color Filter': 'Color Filter',
  Sepia: 'Sepia',
  Sepia2: 'Sepia2',
  Invert: 'Invert',
  Pixelate: 'Pixelate',
  Threshold: 'Threshold',
  Tint: 'Tint',
  Multiply: 'Multiply',
  Blend: 'Blend',
};

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
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<TuiImageEditor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get aspect ratio value
  const getAspectRatio = useCallback(() => {
    switch (aspectRatio) {
      case 'avatar':
        return 1;
      case 'banner':
        return 16 / 9; // 16:9 ratio - standard widescreen banner
      default:
        return NaN; // Free ratio
    }
  }, [aspectRatio]);

  // Get max dimensions for output based on aspect ratio type
  const getMaxDimensions = useCallback(() => {
    switch (aspectRatio) {
      case 'avatar':
        return { width: 400, height: 400 };
      case 'banner':
        return { width: 1280, height: 720 }; // 16:9 ratio
      default:
        return { width: 1920, height: 1080 }; // Default max
    }
  }, [aspectRatio]);

  // Handle save with resize
  const handleSave = useCallback(async () => {
    const editorInstance = editorInstanceRef.current;
    if (!editorInstance) return;

    const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    const extension = format;

    // Auto-apply any pending crop before exporting
    // getCropzoneRect returns the crop zone if one is active
    try {
      const cropRect = editorInstance.getCropzoneRect();
      if (cropRect && cropRect.width > 0 && cropRect.height > 0) {
        // Apply the crop
        await editorInstance.crop(cropRect);
      }
    } catch {
      // No crop zone active, that's fine - continue with current state
    }

    // Get the edited image as base64 at current size
    const originalBase64 = editorInstance.toDataURL({
      format: format === 'jpeg' ? 'jpeg' : format,
      quality,
    });

    // Get image dimensions
    const canvasSize = editorInstance.getCanvasSize();
    const maxDims = getMaxDimensions();

    // Check if we need to resize
    const needsResize = canvasSize.width > maxDims.width || canvasSize.height > maxDims.height;

    if (needsResize) {
      // Calculate new dimensions maintaining aspect ratio
      const scale = Math.min(maxDims.width / canvasSize.width, maxDims.height / canvasSize.height);
      const newWidth = Math.round(canvasSize.width * scale);
      const newHeight = Math.round(canvasSize.height * scale);

      // Create a canvas to resize
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Use high-quality scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          const resizedBase64 = canvas.toDataURL(mimeType, quality);

          const savedImageData: SavedImageData = {
            name: 'edited-image',
            extension,
            mimeType,
            fullName: `edited-image.${extension}`,
            height: newHeight,
            width: newWidth,
            imageBase64: resizedBase64,
            quality,
          };

          onSave(savedImageData, {});
        }
      };
      img.src = originalBase64;
    } else {
      // No resize needed, use original
      const savedImageData: SavedImageData = {
        name: 'edited-image',
        extension,
        mimeType,
        fullName: `edited-image.${extension}`,
        height: canvasSize.height,
        width: canvasSize.width,
        imageBase64: originalBase64,
        quality,
      };

      onSave(savedImageData, {});
    }
  }, [format, quality, onSave, getMaxDimensions]);

  // Handle close
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Editor height calculation
  const heightValue = typeof height === 'number' ? `${height}px` : height;

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current || !source) return;

    // Cleanup previous instance
    if (editorInstanceRef.current) {
      editorInstanceRef.current.destroy();
      editorInstanceRef.current = null;
    }

    setIsLoading(true);

    // Create new editor instance
    const editor = new TuiImageEditor(containerRef.current, {
      includeUI: {
        loadImage: {
          path: source,
          name: 'image',
        },
        theme: darkTheme,
        menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'filter'],
        initMenu: defaultTab || '',
        uiSize: {
          width: '100%',
          height: heightValue,
        },
        menuBarPosition: 'bottom',
        locale: customLocale,
      },
      cssMaxHeight: 800,
      cssMaxWidth: 1200,
      selectionStyle: {
        cornerSize: 20,
        rotatingPointOffset: 70,
      },
      usageStatistics: false,
    });

    editorInstanceRef.current = editor;

    // Wait for image to load
    editor.loadImageFromURL(source, 'image')
      .then(() => {
        setIsLoading(false);
        // Apply initial crop ratio if specified
        const ratio = getAspectRatio();
        if (!isNaN(ratio)) {
          editor.setCropzoneRect(ratio);
        }
      })
      .catch((err: Error) => {
        console.error('Failed to load image:', err);
        setIsLoading(false);
      });

    // Cleanup on unmount
    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, [source, defaultTab, heightValue, getAspectRatio]);

  return (
    <div className="toast-ui-image-editor-container relative" style={{ height: heightValue }}>
      {/* Hide buttons not needed for single image editing */}
      <style>{`
        /* Hide Load/Download buttons in header */
        .tui-image-editor-header .tui-image-editor-header-buttons {
          display: none !important;
        }
        /* Hide Delete and Delete All - confusing, users can use Undo instead */
        .tui-image-editor-help-menu .tie-btn-delete,
        .tui-image-editor-help-menu .tie-btn-deleteAll {
          display: none !important;
        }
      `}</style>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Container for Toast UI Image Editor */}
      <div ref={containerRef} style={{ width: '100%', height: heightValue }} />

      {/* Custom action buttons */}
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
          onClick={handleSave}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
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
