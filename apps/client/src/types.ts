export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'pencil';

export interface Page { id: string; name: string; }

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number; // radians
  color?: string;
  strokeWidth?: number;
  fill?: string;
  pageId: string;
}

export interface TextShape extends BaseShape {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  width: number;
  height: number;
}

export interface PencilShape extends BaseShape {
  type: 'pencil';
  points: Array<{ x: number; y: number }>;
}

export type Shape = BaseShape | TextShape | PencilShape;

export type Tool = 'select' | 'pencil' | 'line' | 'circle' | 'rect' | 'arrow' | 'text' | 'eraser';
