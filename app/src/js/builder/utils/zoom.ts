export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;
export const ZOOM_STEP = 0.1;

export const DEFAULT_CANVAS_WIDTH = 3000;
export const DEFAULT_CANVAS_HEIGHT = 2000;

import { updateConnections } from '../services/connectionService/connectionService.js';

export function setupCanvasDimensions(canvasContainer: HTMLElement): void {
  const canvasContent = canvasContainer.querySelector('.canvas-content') as HTMLElement;
  if (!canvasContent) return;

  canvasContent.style.width = `${DEFAULT_CANVAS_WIDTH}px`;
  canvasContent.style.height = `${DEFAULT_CANVAS_HEIGHT}px`;

  canvasContainer.scrollLeft = (DEFAULT_CANVAS_WIDTH - canvasContainer.clientWidth) / 2;
  canvasContainer.scrollTop = (DEFAULT_CANVAS_HEIGHT - canvasContainer.clientHeight) / 3;
}

export function applyZoom(canvasContainer: HTMLElement, zoomLevel: number): void {
  const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel));

  const beforeZoomCenterX = canvasContainer.scrollLeft + canvasContainer.clientWidth / 2;
  const beforeZoomCenterY = canvasContainer.scrollTop + canvasContainer.clientHeight / 2;

  const currentZoom = parseFloat(canvasContainer.dataset.zoomLevel || '1');

  const canvasContent = canvasContainer.querySelector('.canvas-content') as HTMLElement;
  if (!canvasContent) return;

  canvasContent.style.transform = `scale(${clampedZoom})`;
  canvasContent.style.transformOrigin = '0 0';

  canvasContainer.dataset.zoomLevel = clampedZoom.toString();

  const zoomIndicator = document.getElementById('zoom-indicator');
  if (zoomIndicator) {
    zoomIndicator.textContent = `${Math.round(clampedZoom * 100)}%`;
  }

  setTimeout(() => {
    const afterZoomCenterX = beforeZoomCenterX * (clampedZoom / currentZoom);
    const afterZoomCenterY = beforeZoomCenterY * (clampedZoom / currentZoom);

    canvasContainer.scrollLeft = afterZoomCenterX - canvasContainer.clientWidth / 2;
    canvasContainer.scrollTop = afterZoomCenterY - canvasContainer.clientHeight / 2;
  }, 10);

  setTimeout(() => {
    updateConnections();
  }, 20);
}

export function initZoomControls(canvasContainer: HTMLElement): void {
  const initialZoom = 1;
  canvasContainer.dataset.zoomLevel = initialZoom.toString();

  setupCanvasDimensions(canvasContainer);

  const zoomInBtn = document.querySelector('.tool[title="Zoom In"]');
  zoomInBtn?.addEventListener('click', () => {
    zoomIn(canvasContainer);
  });

  const zoomOutBtn = document.querySelector('.tool[title="Zoom Out"]');
  zoomOutBtn?.addEventListener('click', () => {
    zoomOut(canvasContainer);
  });

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      zoomIn(canvasContainer);
    } else if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      zoomOut(canvasContainer);
    }
  });

  canvasContainer.addEventListener('wheel', e => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn(canvasContainer);
      } else if (e.deltaY > 0) {
        zoomOut(canvasContainer);
      }
    } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      canvasContainer.scrollLeft += e.deltaX || e.deltaY;
    }
  });

  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let startScrollTop = 0;

  canvasContainer.addEventListener('mousedown', e => {
    if (
      e.target === canvasContainer ||
      e.target === canvasContainer.querySelector('.canvas-content')
    ) {
      isPanning = true;
      startX = e.pageX;
      startY = e.pageY;
      startScrollLeft = canvasContainer.scrollLeft;
      startScrollTop = canvasContainer.scrollTop;
      canvasContainer.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  document.addEventListener('mousemove', e => {
    if (!isPanning) return;

    const x = e.pageX;
    const y = e.pageY;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;

    canvasContainer.scrollLeft = startScrollLeft - walkX;
    canvasContainer.scrollTop = startScrollTop - walkY;
  });

  document.addEventListener('mouseup', () => {
    isPanning = false;
    canvasContainer.style.cursor = '';
  });

  canvasContainer.addEventListener('mouseleave', () => {
    if (isPanning) {
      isPanning = false;
      canvasContainer.style.cursor = '';
    }
  });

  let scrollTimeout: number | null = null;
  canvasContainer.addEventListener('scroll', () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    scrollTimeout = setTimeout(() => {
      updateConnections();
    }, 10) as unknown as number;
  });
}

export function zoomIn(canvasContainer: HTMLElement): void {
  const currentZoom = parseFloat(canvasContainer.dataset.zoomLevel || '1');
  applyZoom(canvasContainer, currentZoom + ZOOM_STEP);
}

export function zoomOut(canvasContainer: HTMLElement): void {
  const currentZoom = parseFloat(canvasContainer.dataset.zoomLevel || '1');
  applyZoom(canvasContainer, currentZoom - ZOOM_STEP);
}
