import React, { useRef, useCallback, useEffect } from 'react';
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
  canvasOffsetY = 0
}: UseCanvasEventsProps) => {
  const isPanning = useRef(false);
  const isAltDownRef = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const selectionStartPoint = useRef<{x: number, y: number} | null>(null);
  const scrollDirection = useRef<'up' | 'down' | 'left' | 'right' | null>(null);
  const scrollAnimationRef = useRef<number | null>(null);

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
        if (viewportRef.current && !isPanning.current) viewportRef.current.style.cursor = 'grab';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [viewportRef]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const viewport = viewportRef.current;
    if (!viewport) return;

    const boardRefRect = boardRef.current?.getBoundingClientRect();
    if (!boardRefRect) return;

    const viewportRect = viewport.getBoundingClientRect();
    // Mouse position within the viewport (the scrollable area)
    const mouseX = e.clientX - viewportRect.left;
    const mouseY = e.clientY - viewportRect.top;

    // Point on the board before scaling, relative to logical (0,0)
    const boardX = (e.clientX - boardRefRect.left) / zoom;
    const boardY = (e.clientY - boardRefRect.top) / zoom;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(zoom * delta, 5));
    
    if (newZoom !== zoom) {
      setZoom(newZoom);

      // Keep the same board point under the mouse:
      // new scroll = (board point + origin offset) * new zoom - mouse position within viewport
      viewport.scrollLeft = (boardX + canvasOffsetX) * newZoom - mouseX;
      viewport.scrollTop = (boardY + canvasOffsetY) * newZoom - mouseY;
    }
  }, [zoom, setZoom, viewportRef, boardRef, canvasOffsetX, canvasOffsetY]);

  const handlePanMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current || !viewportRef.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    viewportRef.current.scrollLeft = panStart.current.scrollLeft - dx;
    viewportRef.current.scrollTop = panStart.current.scrollTop - dy;
  }, [viewportRef]);

  const handlePanMouseUp = useCallback(() => {
    isPanning.current = false;
    if (viewportRef.current) viewportRef.current.style.cursor = 'grab';
    document.removeEventListener('mousemove', handlePanMouseMove);
    document.removeEventListener('mouseup', handlePanMouseUp);
  }, [viewportRef, handlePanMouseMove]);

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
          itemBottom > finalY
        );
      })
      .map(item => item.id);

    setSelectedItemIds(selectedIds);
    setMultiSelectRect(null);
    selectionStartPoint.current = null;
    document.removeEventListener('mousemove', handleMultiSelectMouseMove);
    document.removeEventListener('mouseup', handleMultiSelectMouseUp);
  }, [activeBoard, zoom, boardRef, setMultiSelectRect, setSelectedItemIds, handleMultiSelectMouseMove]);

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
    if (viewportRef.current) viewportRef.current.style.cursor = 'grab';
    document.removeEventListener('touchmove', handlePanTouchMove);
    document.removeEventListener('touchend', handlePanTouchEnd);
  }, [viewportRef, handlePanTouchMove]);

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
    handleWheel,
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
