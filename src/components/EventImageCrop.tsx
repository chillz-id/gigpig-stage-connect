/**
 * EventImageCrop - Event banner cropping component
 *
 * This is a backward-compatible wrapper that now uses the Filerobot Image Editor
 * instead of the old canvas-based implementation.
 *
 * Features (via Filerobot):
 * - Crop with 16:9 aspect ratio (banner format)
 * - Rotate and flip
 * - Brightness, contrast, saturation adjustments
 * - Filters
 * - Annotations (draw, text, shapes)
 * - Watermarks
 */

import { EventImageCropModal } from '@/components/ui/ImageEditorModal';

// Re-export the new component with the same interface
export { EventImageCropModal as EventImageCrop };
export default EventImageCropModal;
