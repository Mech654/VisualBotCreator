/**
 * Utility functions for canvas zooming
 */

// Define zoom constants
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;
export const ZOOM_STEP = 0.1;

// Canvas default dimensions (larger than view)
export const DEFAULT_CANVAS_WIDTH = 3000;
export const DEFAULT_CANVAS_HEIGHT = 2000;

// Import updateConnections function
import { updateConnections } from '../services/connectionService.js';

/**
 * Setup the canvas dimensions
 */
export function setupCanvasDimensions(canvasContainer: HTMLElement): void {
  // Get the canvas content element
  const canvasContent = canvasContainer.querySelector('.canvas-content') as HTMLElement;
  if (!canvasContent) return;
  
  // Set the canvas content to be much larger than the viewport
  canvasContent.style.width = `${DEFAULT_CANVAS_WIDTH}px`;
  canvasContent.style.height = `${DEFAULT_CANVAS_HEIGHT}px`;
  
  // Center the canvas content in the viewport initially
  canvasContainer.scrollLeft = (DEFAULT_CANVAS_WIDTH - canvasContainer.clientWidth) / 2;
  canvasContainer.scrollTop = (DEFAULT_CANVAS_HEIGHT - canvasContainer.clientHeight) / 3; // More towards the top
}

/**
 * Apply zoom level to canvas
 */
export function applyZoom(canvasContainer: HTMLElement, zoomLevel: number): void {
  // Ensure zoom level is within bounds
  const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel));
  
  // Calculate current scroll center position before zooming
  const beforeZoomCenterX = canvasContainer.scrollLeft + canvasContainer.clientWidth / 2;
  const beforeZoomCenterY = canvasContainer.scrollTop + canvasContainer.clientHeight / 2;
  
  // Get the current zoom level
  const currentZoom = parseFloat(canvasContainer.dataset.zoomLevel || '1');
  
  // Get the canvas content element
  const canvasContent = canvasContainer.querySelector('.canvas-content') as HTMLElement;
  if (!canvasContent) return;
  
  // Apply the scale transformation to the canvas content
  // Note: We're using scale() here which will properly resize all elements
  canvasContent.style.transform = `scale(${clampedZoom})`;
  canvasContent.style.transformOrigin = '0 0'; // Setting to top-left for more predictable scaling
  
  // Store current zoom level as data attribute
  canvasContainer.dataset.zoomLevel = clampedZoom.toString();
  
  // Update zoom indicator if it exists
  const zoomIndicator = document.getElementById('zoom-indicator');
  if (zoomIndicator) {
    zoomIndicator.textContent = `${Math.round(clampedZoom * 100)}%`;
  }
  
  // Adjust scroll position to maintain center point after zoom
  setTimeout(() => {
    // Calculate new target scroll position to maintain the same center
    const afterZoomCenterX = beforeZoomCenterX * (clampedZoom / currentZoom);
    const afterZoomCenterY = beforeZoomCenterY * (clampedZoom / currentZoom);
    
    // Apply new scroll position
    canvasContainer.scrollLeft = afterZoomCenterX - canvasContainer.clientWidth / 2;
    canvasContainer.scrollTop = afterZoomCenterY - canvasContainer.clientHeight / 2;
  }, 10);

  // Update connections after zoom is applied to ensure they are positioned correctly
  setTimeout(() => {
    updateConnections();
  }, 20);
}

/**
 * Initialize zoom controls for canvas
 */
export function initZoomControls(canvasContainer: HTMLElement): void {
  // Set initial zoom level
  const initialZoom = 1;
  canvasContainer.dataset.zoomLevel = initialZoom.toString();
  
  // Setup the canvas dimensions
  setupCanvasDimensions(canvasContainer);
  
  // Add zoom in button handler
  const zoomInBtn = document.querySelector('.tool[title="Zoom In"]');
  zoomInBtn?.addEventListener('click', () => {
    zoomIn(canvasContainer);
  });
  
  // Add zoom out button handler
  const zoomOutBtn = document.querySelector('.tool[title="Zoom Out"]');
  zoomOutBtn?.addEventListener('click', () => {
    zoomOut(canvasContainer);
  });
  
  // Add keyboard shortcut handlers
  document.addEventListener('keydown', (e) => {
    // Check for Ctrl++ or Ctrl+=
    if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      zoomIn(canvasContainer);
    }
    // Check for Ctrl+-
    else if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      zoomOut(canvasContainer);
    }
  });
  
  // Add wheel event for both zooming and scrolling
  canvasContainer.addEventListener('wheel', (e) => {
    // If ctrl is pressed, handle zoom
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        // Scrolling up should zoom in (make things bigger)
        zoomIn(canvasContainer);
      } else if (e.deltaY > 0) {
        // Scrolling down should zoom out (make things smaller)
        zoomOut(canvasContainer);
      }
    } 
    // If shift is pressed, or this is a horizontal scroll event (trackpad), handle horizontal scrolling
    else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      canvasContainer.scrollLeft += e.deltaX || e.deltaY;
    }
    // Otherwise, vertical scrolling is handled naturally by the browser
  });
  
  // Add pan functionality with mouse drag
  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let startScrollTop = 0;
  
  // Only activate pan when directly clicking on canvas background, not nodes
  canvasContainer.addEventListener('mousedown', (e) => {
    // Only initiate panning if clicking directly on the canvas or canvas-content, not nodes or other elements
    if (e.target === canvasContainer || e.target === canvasContainer.querySelector('.canvas-content')) {
      isPanning = true;
      startX = e.pageX;
      startY = e.pageY;
      startScrollLeft = canvasContainer.scrollLeft;
      startScrollTop = canvasContainer.scrollTop;
      canvasContainer.style.cursor = 'grabbing';
      e.preventDefault(); // Prevent text selection during drag
    }
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    
    const x = e.pageX;
    const y = e.pageY;
    const walkX = (x - startX) * 1.5; // Adjust multiplier for faster/slower panning
    const walkY = (y - startY) * 1.5;
    
    canvasContainer.scrollLeft = startScrollLeft - walkX;
    canvasContainer.scrollTop = startScrollTop - walkY;
  });
  
  document.addEventListener('mouseup', () => {
    isPanning = false;
    canvasContainer.style.cursor = '';
  });
  
  // Reset cursor when leaving the canvas
  canvasContainer.addEventListener('mouseleave', () => {
    if (isPanning) {
      isPanning = false;
      canvasContainer.style.cursor = '';
    }
  });

  // Add scroll event listener to update connections when scrolling
  let scrollTimeout: number | null = null;
  canvasContainer.addEventListener('scroll', () => {
    // Update connections on scroll, with debouncing for performance
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    scrollTimeout = setTimeout(() => {
      updateConnections();
    }, 10) as unknown as number;
  });
}

/**
 * Zoom in on canvas - makes things BIGGER
 */
export function zoomIn(canvasContainer: HTMLElement): void {
  const currentZoom = parseFloat(canvasContainer.dataset.zoomLevel || '1');
  applyZoom(canvasContainer, currentZoom + ZOOM_STEP);
}

/**
 * Zoom out on canvas - makes things SMALLER
 */
export function zoomOut(canvasContainer: HTMLElement): void {
  const currentZoom = parseFloat(canvasContainer.dataset.zoomLevel || '1');
  applyZoom(canvasContainer, currentZoom - ZOOM_STEP);
}