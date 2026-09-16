import React, { useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Board, BoardItem } from '../types';
import { GRID_SIZE } from '../constants';

interface UseCanvasEventsProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  viewportRef: React.RefObject<HTMLDivElement>;
  boardRef: React.RefObject<HTMLDivElement>;
  isMultiSelectMode: boolean;
  isGridVisible: boolean;
  setSelectedItemId: (id: string | null) => void;
  setSelectedItemIds: React.Dispatch<React.SetStateAction<string[]>>;
  setMultiSelectRect: React.Dispatch<React.SetStateAction<{ x: number; y: number; width: number; height: number; } | null>>;
  setSelectionRect: React.Dispatch<React.SetStateAction<{ x: number; y: number; width: number; height: number; } | null>>;
  setIsSelectingArea: React.Dispatch<React.SetStateAction<boolean>>;
  activeBoard: Board;
  onScreenshot: (area?: { x: number; y: number; width: number; height: number }) => void;
  canvasOffsetX?: number;
  canvasOffsetY?: number;
  hiddenItemIds?: Set<string>;
}

export const useCanvasEvents = ({
  zoom,
  setZoom,
  viewportRef,
  boardRef,
  isMultiSelectMode,
  isGridVisible,
  setSelectedItemId,
  setSelectedItemIds,
  setMultiSelectRect,
  setSelectionRect,
  setIsSelectingArea,
  activeBoard,
  onScreenshot,
  canvasOffsetX = 0,
  canvasOffsetY = 0,
  hiddenItemIds
}: UseCanvasEventsProps) => {
  const isPanning = useRef(false);
  const isAltDownRef = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const selectionStartPoint = useRef<{x: number, y: number} | null>(null);
  const scrollDirection = useRef<'up' | 'down' | 'left' | 'right' | null>(null);
  const scrollAnimationRef = useRef<number | null>(null);

  // A zoom change resizes the scrollable content (canvasWidth/Height * zoom in
  // BoardCanvas), which only takes effect once React commits the new `zoom`
  // to the DOM. Setting scrollLeft/scrollTop synchronously in the same event
  // that calls setZoom races that commit: the browser can clamp the scroll to
  // the *old* content size for one frame, making an item appear to jump.
  // Instead, stash the desired board point + zoom, and apply the scroll from
  // a layout effect keyed on `zoom`, which always runs after the resize lands.
  const pendingFocusRef = useRef<{ boardX: number; boardY: number; viewportX: number; viewportY: number } | null>(null);

  const focusOnBoardPoint = useCallback((boardX: number, boardY: number, viewportX: number, viewportY: number, newZoom: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (newZoom === zoom) {
      viewport.scrollLeft = (boardX + canvasOffsetX) * newZoom - viewportX;
      viewport.scrollTop = (boardY + canvasOffsetY) * newZoom - viewportY;
      return;
    }
    pendingFocusRef.current = { boardX, boardY, viewportX, viewportY };
    setZoom(newZoom);
  }, [zoom, setZoom, viewportRef, canvasOffsetX, canvasOffsetY]);

  useLayoutEffect(() => {
    const focus = pendingFocusRef.current;
    const viewport = viewportRef.current;
    if (!focus || !viewport) return;
    pendingFocusRef.current = null;
    viewport.scrollLeft = (focus.boardX + canvasOffsetX) * zoom - focus.viewportX;
    viewport.scrollTop = (focus.boardY + canvasOffsetY) * zoom - focus.viewportY;
  }, [zoom, canvasOffsetX, canvasOffsetY, viewportRef]);

  // Mientras se mantiene ALT, el puntero actúa como modo selección (cursor de mira).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && !isAltDownRef.current) {
        isAltDownRef.current = true;
        if (viewportRef.current && !isPanning.current) viewportRef.current.style.cursor = 'crosshair';
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        isAltDownRef.current = false;
        // Releasing Alt should restore whatever cursor the CURRENT mode calls for,
        // not hardcode 'grab' — otherwise releasing Alt while Modo Selección is on
        // leaves the cursor stuck looking like grab-mode even though the mode itself
        // never changed.
        if (viewportRef.current && !isPanning.current) {
          viewportRef.current.style.cursor = isMultiSelectMode ? 'crosshair' : 'grab';
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [viewportRef, isMultiSelectMode]);

  // Whenever Modo Selección is toggled, clear any inline cursor style left over
  // from panning/Alt so the mode's own Tailwind class (cursor-crosshair/cursor-grab)
  // — which has lower specificity than an inline style — is free to take effect again.
  useEffect(() => {
    if (viewportRef.current && !isPanning.current) {
      viewportRef.current.style.cursor = '';
    }
  }, [isMultiSelectMode, viewportRef]);

  const handleWheel = useCallback((e: WheelEvent) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const boardRefRect = boardRef.current?.getBoundingClientRect();
    if (!boardRefRect) return;

    e.preventDefault();

    const viewportRect = viewport.getBoundingClientRect();
    // Mouse position within the viewport (the scrollable area)
    const viewportX = e.clientX - viewportRect.left;
    const viewportY = e.clientY - viewportRect.top;

    // Point on the board before scaling, relative to logical (0,0)
    const boardX = (e.clientX - boardRefRect.left) / zoom;
    const boardY = (e.clientY - boardRefRect.top) / zoom;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(zoom * delta, 5));

    // Keep the same board point under the mouse.
    focusOnBoardPoint(boardX, boardY, viewportX, viewportY, newZoom);
  }, [zoom, boardRef, viewportRef, focusOnBoardPoint]);

  // React always attaches its "wheel" root listener with { passive: true }
  // (see react-dom's addTrappedEventListener), so e.preventDefault() inside a
  // JSX onWheel handler is silently ignored: the browser's native scroll
  // fires *in addition to* our own scrollLeft/scrollTop math below, and the
  // two compete for the same viewport, which is what reads as zoom "jumps".
  // Attaching the listener manually with passive: false makes preventDefault
  // actually take effect.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [viewportRef, handleWheel]);

  const handleCenterContent = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const viewportX = viewport.clientWidth / 2;
    const viewportY = viewport.clientHeight / 2;
    const items = activeBoard.items;

    if (items.length === 0) {
      // Nothing to fit: just center on the logical origin at the current zoom.
      focusOnBoardPoint(0, 0, viewportX, viewportY, zoom);
      return;
    }

    const minX = Math.min(...items.map(i => i.x));
    const minY = Math.min(...items.map(i => i.y));
    const maxX = Math.max(...items.map(i => i.x + i.width));
    const maxY = Math.max(...items.map(i => i.y + i.height));

    const PADDING = 150; // logical px of breathing room around the content
    const contentWidth = (maxX - minX) + PADDING * 2;
    const contentHeight = (maxY - minY) + PADDING * 2;

    const fitZoom = Math.max(0.1, Math.min(
      viewport.clientWidth / contentWidth,
      viewport.clientHeight / contentHeight,
      2 // don't zoom in absurdly far for a single small item
    ));

    focusOnBoardPoint((minX + maxX) / 2, (minY + maxY) / 2, viewportX, viewportY, fitZoom);
  }, [activeBoard, zoom, viewportRef, focusOnBoardPoint]);

  const handlePanMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current || !viewportRef.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    viewportRef.current.scrollLeft = panStart.current.scrollLeft - dx;
    viewportRef.current.scrollTop = panStart.current.scrollTop - dy;
  }, [viewportRef]);

  const handlePanMouseUp = useCallback(() => {
    isPanning.current = false;
    if (viewportRef.current) viewportRef.current.style.cursor = isMultiSelectMode ? 'crosshair' : 'grab';
    document.removeEventListener('mousemove', handlePanMouseMove);
    document.removeEventListener('mouseup', handlePanMouseUp);
  }, [viewportRef, handlePanMouseMove, isMultiSelectMode]);

  const handleMultiSelectMouseMove = useCallback((e: MouseEvent) => {
    if (!selectionStartPoint.current || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / zoom;
    const currentY = (e.clientY - rect.top) / zoom;
    const x = Math.min(selectionStartPoint.current.x, currentX);
    const y = Math.min(selectionStartPoint.current.y, currentY);
    const width = Math.abs(selectionStartPoint.current.x - currentX);
    const height = Math.abs(selectionStartPoint.current.y - currentY);
    setMultiSelectRect({ x, y, width, height });
  }, [zoom, boardRef, setMultiSelectRect]);

  const handleMultiSelectMouseUp = useCallback((e: MouseEvent) => {
    if (!selectionStartPoint.current || !boardRef.current || !activeBoard) {
      setMultiSelectRect(null);
      selectionStartPoint.current = null;
      document.removeEventListener('mousemove', handleMultiSelectMouseMove);
      document.removeEventListener('mouseup', handleMultiSelectMouseUp);
      return;
    }

    const rect = boardRef.current.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / zoom;
    const currentY = (e.clientY - rect.top) / zoom;
    
    const finalX = Math.min(selectionStartPoint.current.x, currentX);
    const finalY = Math.min(selectionStartPoint.current.y, currentY);
    const finalWidth = Math.abs(selectionStartPoint.current.x - currentX);
    const finalHeight = Math.abs(selectionStartPoint.current.y - currentY);

    const selectedIds = activeBoard.items
      .filter(item => {
        const itemRight = item.x + item.width;
        const itemBottom = item.y + item.height;
        const rectRight = finalX + finalWidth;
        const rectBottom = finalY + finalHeight;
        return (
          item.x < rectRight &&
          itemRight > finalX &&
          item.y < rectBottom &&
          itemBottom > finalY &&
          !(hiddenItemIds?.has(item.id))
        );
      })
      .map(item => item.id);

    setSelectedItemIds(selectedIds);
    setMultiSelectRect(null);
    selectionStartPoint.current = null;
    document.removeEventListener('mousemove', handleMultiSelectMouseMove);
    document.removeEventListener('mouseup', handleMultiSelectMouseUp);
  }, [activeBoard, zoom, boardRef, setMultiSelectRect, setSelectedItemIds, handleMultiSelectMouseMove, hiddenItemIds]);

  const handlePanMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {
      e.preventDefault(); // Evita el compás de auto-scroll nativo del navegador
    }
    if ((e.target as HTMLElement).closest('.group') || (e.target as HTMLElement).closest('button')) return;
    setSelectedItemId(null);
    if (!e.shiftKey && !e.altKey && !isMultiSelectMode) setSelectedItemIds([]);

    const viewport = viewportRef.current;
    if (!viewport) return;

    if (isMultiSelectMode || e.shiftKey || e.altKey) {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const startX = (e.clientX - rect.left) / zoom;
      const startY = (e.clientY - rect.top) / zoom;
      selectionStartPoint.current = { x: startX, y: startY };
      setMultiSelectRect({ x: startX, y: startY, width: 0, height: 0 });
      document.addEventListener('mousemove', handleMultiSelectMouseMove);
      document.addEventListener('mouseup', handleMultiSelectMouseUp);
      return;
    }

    isPanning.current = true;
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    viewport.style.cursor = 'grabbing';
    document.addEventListener('mousemove', handlePanMouseMove);
    document.addEventListener('mouseup', handlePanMouseUp);
  };

  const handlePanTouchMove = useCallback((e: TouchEvent) => {
    if (!isPanning.current || !viewportRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - panStart.current.x;
    const dy = touch.clientY - panStart.current.y;
    viewportRef.current.scrollLeft = panStart.current.scrollLeft - dx;
    viewportRef.current.scrollTop = panStart.current.scrollTop - dy;
  }, [viewportRef]);

  const handlePanTouchEnd = useCallback(() => {
    isPanning.current = false;
    if (viewportRef.current) viewportRef.current.style.cursor = isMultiSelectMode ? 'crosshair' : 'grab';
    document.removeEventListener('touchmove', handlePanTouchMove);
    document.removeEventListener('touchend', handlePanTouchEnd);
  }, [viewportRef, handlePanTouchMove, isMultiSelectMode]);

  const handlePanTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.group') || (e.target as HTMLElement).closest('button') || e.touches.length !== 1) return;
    setSelectedItemId(null);
    const viewport = viewportRef.current;
    if (!viewport) return;
    isPanning.current = true;
    const touch = e.touches[0];
    panStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    viewport.style.cursor = 'grabbing';
    document.addEventListener('touchmove', handlePanTouchMove, { passive: false });
    document.addEventListener('touchend', handlePanTouchEnd);
  };

  const handleSelectionMouseMove = useCallback((e: MouseEvent) => {
    if (!selectionStartPoint.current || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    let currentX = (e.clientX - rect.left) / zoom;
    let currentY = (e.clientY - rect.top) / zoom;
    if (isGridVisible) {
      currentX = Math.round(currentX / GRID_SIZE) * GRID_SIZE;
      currentY = Math.round(currentY / GRID_SIZE) * GRID_SIZE;
    }
    const startX = selectionStartPoint.current.x;
    const startY = selectionStartPoint.current.y;
    setSelectionRect({
      x: Math.min(startX, currentX),
      y: Math.min(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY)
    });
  }, [zoom, isGridVisible, viewportRef, setSelectionRect]);

  const handleSelectionMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleSelectionMouseMove);
    document.removeEventListener('mouseup', handleSelectionMouseUp);
    setSelectionRect(prevRect => {
      if (prevRect && (prevRect.width > 10 || prevRect.height > 10)) {
        onScreenshot(prevRect);
      }
      return null;
    });
    selectionStartPoint.current = null;
    setIsSelectingArea(false);
  }, [handleSelectionMouseMove, onScreenshot, setIsSelectingArea, setSelectionRect]);

  const handleSelectionMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    let boardX = (e.clientX - rect.left) / zoom;
    let boardY = (e.clientY - rect.top) / zoom;
    if (isGridVisible) {
      boardX = Math.round(boardX / GRID_SIZE) * GRID_SIZE;
      boardY = Math.round(boardY / GRID_SIZE) * GRID_SIZE;
    }
    selectionStartPoint.current = { x: boardX, y: boardY };
    setSelectionRect({ x: boardX, y: boardY, width: 0, height: 0 });
    document.addEventListener('mousemove', handleSelectionMouseMove);
    document.addEventListener('mouseup', handleSelectionMouseUp);
  };

  const scrollBoard = useCallback(() => {
    if (!viewportRef.current || !scrollDirection.current) return;
    const SCROLL_SPEED = 5;
    switch(scrollDirection.current) {
      case 'up': viewportRef.current.scrollTop -= SCROLL_SPEED; break;
      case 'down': viewportRef.current.scrollTop += SCROLL_SPEED; break;
      case 'left': viewportRef.current.scrollLeft -= SCROLL_SPEED; break;
      case 'right': viewportRef.current.scrollLeft += SCROLL_SPEED; break;
    }
    scrollAnimationRef.current = requestAnimationFrame(scrollBoard);
  }, [viewportRef]);

  const handleMoveStart = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    scrollDirection.current = direction;
    scrollAnimationRef.current = requestAnimationFrame(scrollBoard);
  }, [scrollBoard]);

  const handleMoveEnd = useCallback(() => {
    scrollDirection.current = null;
    if(scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current);
  }, []);

  return {
    handleCenterContent,
    handlePanMouseDown,
    handlePanTouchStart,
    handleSelectionMouseDown,
    handleMoveStart,
    handleMoveEnd,
    handlePanMouseMove,
    handlePanMouseUp,
    handlePanTouchMove,
    handlePanTouchEnd,
    handleSelectionMouseMove,
    handleSelectionMouseUp,
    handleMultiSelectMouseMove,
    handleMultiSelectMouseUp
  };
};
