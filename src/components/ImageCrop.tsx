/**
 * ImageCrop - Profile avatar cropping component
 *
 * This is a backward-compatible wrapper that now uses the Filerobot Image Editor
 * instead of the old canvas-based implementation.
 *
 * Features (via Filerobot):
 * - Crop with 1:1 aspect ratio
 * - Rotate and flip
 * - Brightness, contrast, saturation adjustments
 * - Filters
 * - Annotations (draw, text, shapes)
 */

import { ImageCropModal } from '@/components/ui/ImageEditorModal';

// Re-export the new component with the same interface
export { ImageCropModal as ImageCrop };
export default ImageCropModal;
