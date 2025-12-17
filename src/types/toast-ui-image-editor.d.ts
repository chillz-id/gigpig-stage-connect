/**
 * Type declarations for Toast UI Image Editor
 * @see https://github.com/nhn/tui.image-editor
 */

declare module '@toast-ui/react-image-editor' {
  import { Component, RefObject } from 'react';

  export interface ITheme {
    [key: string]: string;
  }

  export interface IIconOptions {
    fill?: string;
    path?: string;
  }

  export interface IShapeOptions {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }

  export interface ICropDimension {
    left: number;
    top: number;
    width: number;
    height: number;
  }

  export interface ICanvasSize {
    width: number;
    height: number;
  }

  export interface IIncludeUIOptions {
    loadImage?: {
      path: string;
      name: string;
    };
    theme?: ITheme;
    menu?: string[];
    initMenu?: string;
    uiSize?: {
      width: string;
      height: string;
    };
    menuBarPosition?: 'top' | 'bottom' | 'left' | 'right';
    locale?: Record<string, string>;
  }

  export interface ISelectionStyleOptions {
    cornerStyle?: string;
    cornerSize?: number;
    cornerColor?: string;
    cornerStrokeColor?: string;
    transparentCorners?: boolean;
    lineWidth?: number;
    borderColor?: string;
    rotatingPointOffset?: number;
  }

  export interface ToDataURLOptions {
    format?: 'jpeg' | 'png' | 'webp';
    quality?: number;
    multiplier?: number;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  }

  export interface ImageEditorInstance {
    loadImageFromURL(url: string, imageName?: string): Promise<{ oldWidth: number; oldHeight: number; newWidth: number; newHeight: number }>;
    loadImageFromFile(file: File, imageName?: string): Promise<void>;
    toDataURL(options?: ToDataURLOptions): string;
    getCanvasSize(): ICanvasSize;
    getCropzoneRect(): ICropDimension | null;
    setCropzoneRect(ratio?: number): void;
    crop(dimension: ICropDimension): Promise<void>;
    rotate(angle: number, isSilent?: boolean): Promise<void>;
    flipX(): Promise<void>;
    flipY(): Promise<void>;
    applyFilter(type: string, options?: object, isSilent?: boolean): Promise<void>;
    removeFilter(type: string): Promise<void>;
    hasFilter(type: string): boolean;
    resetFlip(): Promise<void>;
    resizeCanvasDimension(dimension: { width: number; height: number }): void;
    undo(): void;
    redo(): void;
    isEmptyUndoStack(): boolean;
    isEmptyRedoStack(): boolean;
    clearUndoStack(): void;
    clearRedoStack(): void;
    destroy(): void;
    on(eventName: string, handler: (...args: unknown[]) => void): void;
    off(eventName: string, handler?: (...args: unknown[]) => void): void;
  }

  export interface ImageEditorProps {
    includeUI?: IIncludeUIOptions;
    cssMaxWidth?: number;
    cssMaxHeight?: number;
    selectionStyle?: ISelectionStyleOptions;
    usageStatistics?: boolean;
  }

  export default class ImageEditor extends Component<ImageEditorProps> {
    getInstance(): ImageEditorInstance;
    getRootElement(): HTMLElement;
  }
}

declare module 'tui-image-editor' {
  export * from '@toast-ui/react-image-editor';
}
