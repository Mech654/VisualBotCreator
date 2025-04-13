import { NodeRectangle } from '../models/types';

// Grid settings for snapping
export const GRID_SIZE = 20; // Match the grid size in CSS

/**
 * Snap a value to the grid
 */
export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

/**
 * Check if two node rectangles collide
 */
export function checkCollision(node1Rect: NodeRectangle, node2Rect: NodeRectangle, tolerance: number = 5): boolean {
  return !(
    node1Rect.right < node2Rect.left + tolerance ||
    node1Rect.left > node2Rect.right - tolerance ||
    node1Rect.bottom < node2Rect.top + tolerance ||
    node1Rect.top > node2Rect.bottom - tolerance
  );
}

/**
 * Show visual collision feedback on a node
 */
export function showCollisionFeedback(node: HTMLElement, isColliding: boolean): void {
  if (isColliding) {
    node.style.boxShadow = '0 0 0 2px var(--danger)';
  } else {
    node.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
  }
}