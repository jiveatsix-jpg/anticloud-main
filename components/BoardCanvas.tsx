import React, { useLayoutEffect, useRef } from 'react';
import DraggableItem from './DraggableItem';
import ParticleSystem from './ParticleSystem';
import { Board, BoardItem, ItemType } from '../types';
import { GRID_SIZE } from '../constants';

interface BoardCanvasProps {
  viewportRef: React.RefObject<HTMLDivElement>;
  boardRef: React.RefObject<HTMLDivElement>;
  activeBoard: Board;
  zoom: number;
  isGridVisible: boolean;
  isMultiSelectMode: boolean;
  handlePanMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handlePanTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleUpdateItem: (updatedItem: BoardItem, selectedItemIds: string[]) => void;
  handleDeleteItem: (id: string, setSelectedItemIds: any, setSelectedItemId: any) => void;
  handleDuplicateItem: (id: string) => void;
  handleStartEditItem: (item: BoardItem, fragmentIndex?: number) => void;
  handleSendItemToBack: (id: string) => void;
  onToggleInventory: (item: BoardItem) => void;
  inventory: BoardItem[];
  isMobileMode: boolean;
  selectedItemId: string | null;
  selectedItemIds: string[];
  setSelectedItemId: (id: string | null) => void;
  setSelectedItemIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectionRect: { x: number; y: number; width: number; height: number; } | null;
  multiSelectRect: { x: number; y: number; width: number; height: number; } | null;
  connectingFromId: string | null;
  setConnectingFromId: (id: string | null) => void;
  connectionPointerCoord: { x: number; y: number } | null;
  setConnectionPointerCoord: (coord: { x: number; y: number } | null) => void;
  handleAddConnection: (fromId: string, toId: string) => void;
  handleRemoveConnection: (connectionId: string) => void;
  setHoveredItemId: (id: string | null) => void;
  hoveredItemId: string | null;
  canvasOffsetX: number;
  canvasOffsetY: number;
  canvasWidth: number;
  canvasHeight: number;
  setMouseCoords: (coords: { x: number; y: number; clientX: number; clientY: number }) => void;
}

const BoardCanvas: React.FC<BoardCanvasProps> = ({
  viewportRef,
  boardRef,
  activeBoard,
  zoom,
  isGridVisible,
  isMultiSelectMode,
  handlePanMouseDown,
  handlePanTouchStart,
  handleUpdateItem,
  handleDeleteItem,
  handleDuplicateItem,
  handleStartEditItem,
  handleSendItemToBack,
  onToggleInventory,
  inventory,
  isMobileMode,
  selectedItemId,
  selectedItemIds,
  setSelectedItemId,
  setSelectedItemIds,
  selectionRect,
  multiSelectRect,
  connectingFromId,
  setConnectingFromId,
  connectionPointerCoord,
  setConnectionPointerCoord,
  handleAddConnection,
  handleRemoveConnection,
  setHoveredItemId,
  hoveredItemId,
  canvasOffsetX,
  canvasOffsetY,
  canvasWidth,
  canvasHeight,
  setMouseCoords
}) => {
  const lastOffsets = useRef({ x: canvasOffsetX, y: canvasOffsetY });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const dx = canvasOffsetX - lastOffsets.current.x;
    const dy = canvasOffsetY - lastOffsets.current.y;

    if (dx !== 0 || dy !== 0) {
      // Adjust scroll to compensate for origin shift and prevent jumps
      viewport.scrollLeft += dx * zoom;
      viewport.scrollTop += dy * zoom;
    }

    lastOffsets.current = { x: canvasOffsetX, y: canvasOffsetY };
  }, [canvasOffsetX, canvasOffsetY, zoom, viewportRef]);

  return (
    <div
      ref={viewportRef}
      id="tutorial-viewport"
      className={`w-full h-full overflow-auto no-scrollbar ${isMultiSelectMode ? 'cursor-crosshair' : 'cursor-grab'}`}
      onMouseDown={handlePanMouseDown}
      onTouchStart={handlePanTouchStart}
      onMouseMove={(e) => {
        if (boardRef.current) {
          const rect = boardRef.current.getBoundingClientRect();
          const currentX = (e.clientX - rect.left) / zoom;
          const currentY = (e.clientY - rect.top) / zoom;
          
          setMouseCoords({
            x: currentX,
            y: currentY,
            clientX: e.clientX,
            clientY: e.clientY
          });

          if (connectingFromId) {
            setConnectionPointerCoord({ x: currentX, y: currentY });
          }
        }
      }}
      onClick={(e) => {
        if (connectingFromId && !(e.target as HTMLElement).closest('.group')) {
          setConnectingFromId(null);
          setConnectionPointerCoord(null);
        }
      }}
    >
      <div
        style={{
          width: `${canvasWidth * zoom}px`,
          height: `${canvasHeight * zoom}px`,
          position: 'relative',
          backgroundColor: '#000000',
        }}
      >
        <div
          className={`relative ${activeBoard.screenFilter ? `filter-${activeBoard.screenFilter}` : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            backgroundImage: activeBoard.backgroundUrl ? `url(${activeBoard.backgroundUrl})` : 'none',
            backgroundRepeat: activeBoard.backgroundMode === 'tile' ? 'repeat' : 'no-repeat',
            backgroundSize: activeBoard.backgroundMode === 'expand' ? '100% 100%' : 'auto',
            backgroundPosition: activeBoard.backgroundMode === 'center' ? 'center' : 'top left',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
        {/* Origin Shift Container - Now the main reference anchor */}
        <div 
          ref={boardRef}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `translate(${canvasOffsetX}px, ${canvasOffsetY}px)` 
          }}
        >
          {/* Infinite Axis Guides (Debug) */}
          <div style={{ position: 'absolute', top: 0, left: -50000, width: 100000, height: '1px', backgroundColor: '#00ffff', opacity: 0.3, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', left: 0, top: -50000, height: 100000, width: '1px', backgroundColor: '#ff00ff', opacity: 0.3, pointerEvents: 'none', zIndex: 0 }} />

          {activeBoard.particles && activeBoard.particles !== 'none' && (
            <div style={{ position: 'absolute', left: -canvasOffsetX, top: -canvasOffsetY, pointerEvents: 'none' }}>
              <ParticleSystem
                type={activeBoard.particles}
                width={canvasWidth}
                height={canvasHeight}
              />
            </div>
          )}
          
          {isGridVisible && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: -canvasOffsetX,
                top: -canvasOffsetY,
                width: canvasWidth,
                height: canvasHeight,
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                backgroundImage: `
                  linear-gradient(to right, var(--pixel-border-color) 1px, transparent 1px),
                  linear-gradient(to bottom, var(--pixel-border-color) 1px, transparent 1px)
                `,
                opacity: 0.2
              }}
            />
          )}

          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', zIndex: 0, overflow: 'visible' }}>
            <g transform={`translate(0, 0)`}>
              {activeBoard.connections?.map(conn => {
                const fromItem = activeBoard.items.find(i => i.id === conn.fromId);
                const toItem = activeBoard.items.find(i => i.id === conn.toId);
                if (!fromItem || !toItem) return null;

                const fromX = fromItem.x + fromItem.width / 2;
                const fromY = fromItem.y + fromItem.height / 2;
                const toX = toItem.x + toItem.width / 2;
                const toY = toItem.y + toItem.height / 2;

                return (
                  <g key={conn.id} className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRemoveConnection(conn.id); }}>
                    <title>Eliminar Conexión</title>
                    <line data-from={conn.fromId} data-to={conn.toId} x1={fromX} y1={fromY} x2={toX} y2={toY} stroke="transparent" strokeWidth="20" />
                    <line
                      data-from={conn.fromId} data-to={conn.toId}
                      x1={fromX} y1={fromY} x2={toX} y2={toY}
                      stroke={conn.color || 'var(--pixel-highlight-color, #ffaa00)'}
                      strokeWidth="4"
                      strokeDasharray="8,8"
                      style={{ animation: 'scanline 2s linear infinite' }}
                    />
                  </g>
                );
              })}

              {connectingFromId && connectionPointerCoord && (() => {
                const fromItem = activeBoard.items.find(i => i.id === connectingFromId);
                if (!fromItem) return null;
                const fromX = fromItem.x + fromItem.width / 2;
                const fromY = fromItem.y + fromItem.height / 2;
                return (
                  <line
                    x1={fromX} y1={fromY}
                    x2={connectionPointerCoord.x} y2={connectionPointerCoord.y}
                    stroke="var(--pixel-highlight-color, #ffaa00)"
                    strokeWidth="4"
                    strokeDasharray="8,8"
                  />
                );
              })()}
            </g>
          </svg>

          {activeBoard.items.map(item => (
            <DraggableItem
              key={item.id}
              item={item}
              onUpdate={(updated) => handleUpdateItem(updated, selectedItemIds, isGridVisible, GRID_SIZE)}
              onDelete={(id) => handleDeleteItem(id, setSelectedItemIds, setSelectedItemId)}
              onDuplicate={handleDuplicateItem}
              onEdit={handleStartEditItem}
              onSendToBack={handleSendItemToBack}
              onToggleInventory={onToggleInventory}
              inventory={inventory}
              boardRef={boardRef}
              zoom={zoom}
              snapToGrid={isGridVisible}
              gridSize={GRID_SIZE}
              isMobileMode={isMobileMode}
              isSelected={item.id === selectedItemId || selectedItemIds.includes(item.id)}
              selectedItemIds={selectedItemIds}
              onSelect={(id) => {
                if (selectedItemIds.includes(id)) return;

                const item = activeBoard.items.find(i => i.id === id);
                if (item?.groupId) {
                  const groupItemIds = activeBoard.items
                    .filter(i => i.groupId === item.groupId)
                    .map(i => i.id);
                  setSelectedItemIds(groupItemIds);
                  setSelectedItemId(null);
                } else {
                  setSelectedItemId(id);
                  setSelectedItemIds([]);
                }
              }}
              connectingFromId={connectingFromId}
              onConnectStart={(id) => setConnectingFromId(id)}
              onConnectComplete={(id) => {
                if (connectingFromId && connectingFromId !== id) {
                  handleAddConnection(connectingFromId, id);
                }
                setConnectingFromId(null);
                setConnectionPointerCoord(null);
              }}
              setHoveredItemId={setHoveredItemId}
              isHovered={item.id === hoveredItemId}
              canvasOffsetX={canvasOffsetX}
              canvasOffsetY={canvasOffsetY}
            />
          ))}
          
          {selectionRect && (
            <div
              className="absolute pointer-events-none shadow-[0_0_10px_var(--pixel-highlight-color)]"
              style={{
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.width,
                height: selectionRect.height,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px dashed var(--pixel-highlight-color)',
              }}
            />
          )}
          {multiSelectRect && (
            <div
              className="absolute pointer-events-none shadow-[0_0_15px_var(--pixel-highlight-color)]"
              style={{
                left: multiSelectRect.x,
                top: multiSelectRect.y,
                width: multiSelectRect.width,
                height: multiSelectRect.height,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid var(--pixel-highlight-color)',
              }}
            />
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default BoardCanvas;
