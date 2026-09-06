import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BoardItem, ItemType } from '../types';
import { DeleteIcon, EditIcon, DuplicateIcon, SendToBackIcon, DpadUpIcon, DpadDownIcon, DpadLeftIcon, DpadRightIcon, PlayIcon, PauseIcon, ResetIcon, CopyIcon, PasteIcon, DownloadIcon, FileIcon, LinkIcon, CheckboxIcon, PaletteIcon } from './Icons';

interface DraggableItemProps {
  item: BoardItem;
  onUpdate: (item: BoardItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEdit: (item: BoardItem, fragmentIndex?: number) => void;
  onSendToBack: (id: string) => void;
  onToggleInventory: (item: BoardItem) => void;
  inventory: BoardItem[];
  boardRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  snapToGrid: boolean;
  gridSize: number;
  isMobileMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  selectedItemIds: string[];
  connectingFromId?: string | null;
  onConnectStart?: (id: string) => void;
  onConnectComplete?: (id: string) => void;
  setHoveredItemId: (id: string | null) => void;
  isHovered: boolean;
  canvasOffsetX?: number;
  canvasOffsetY?: number;
  setDragging?: (dragging: boolean) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, onUpdate, onDelete, onDuplicate, onEdit, onSendToBack, onToggleInventory, inventory, boardRef, zoom, snapToGrid, gridSize, isMobileMode, isSelected, onSelect, selectedItemIds, connectingFromId, onConnectStart, onConnectComplete, setHoveredItemId, isHovered, canvasOffsetX = 0, canvasOffsetY = 0, setDragging }) => {
  // Ajuste fino para la asimetría del sprite (EN PÍXELES) - SOLO TIENES QUE MODIFICAR ESTO
  const MARGENES_TEXTO = {
    izquierdo: 15,
    derecho: 7,
    arriba: 13,
    abajo: 20
  };

  const [isDragging, setIsDragging] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(item.imageUrl);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isEditingText, setIsEditingText] = useState(false);
  const [activeFragmentIndex, setActiveFragmentIndex] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [wasSaved, setWasSaved] = useState(false);
  const isInInventory = inventory.some(i => i.id === item.id);
  const textEditRef = useRef<HTMLParagraphElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const moveTimeoutRef = useRef<number | null>(null);
  const moveIntervalRef = useRef<number | null>(null);
  const itemRef = useRef(item);
  const lastRightClickRef = useRef<number>(0);

  const textDragRef = useRef<{ isDragging: boolean; startX: number; startY: number; initialOffsetX: number; initialOffsetY: number; el: HTMLElement | null }>({
    isDragging: false, startX: 0, startY: 0, initialOffsetX: 0, initialOffsetY: 0, el: null
  });

  const handleTextMouseMove = useCallback((e: MouseEvent) => {
    const state = textDragRef.current;
    if (!isDraggingText || !state.el) return;

    // Obtener las dimensiones reales del texto contenido
    const contentNode = state.el.firstElementChild as HTMLElement;
    const textWidth = contentNode ? (contentNode.getBoundingClientRect().width / zoom) : 0;
    const textHeight = contentNode ? (contentNode.getBoundingClientRect().height / zoom) : 0;

    // Variables de delimitacion para mover el texto visualmente
    let limiteIzquierdoX = -(item.width / 2) + (textWidth / 2) + MARGENES_TEXTO.izquierdo;
    let limiteDerechoX = (item.width / 2) - (textWidth / 2) - MARGENES_TEXTO.derecho;
    let limiteArribaY = -(item.height / 2) + (textHeight / 2) + MARGENES_TEXTO.arriba;
    let limiteAbajoY = (item.height / 2) - (textHeight / 2) - MARGENES_TEXTO.abajo;

    const dx = (e.clientX - state.startX) / zoom;
    const dy = (e.clientY - state.startY) / zoom;

    let newX = state.initialOffsetX + dx;
    let newY = state.initialOffsetY + dy;

    newX = Math.max(limiteIzquierdoX, Math.min(newX, limiteDerechoX));
    newY = Math.max(limiteArribaY, Math.min(newY, limiteAbajoY));

    // Snap a la cuadrícula si está activada
    if (snapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    state.el.style.transform = `translate(${newX}px, ${newY}px)`;
  }, [item.width, item.height, zoom, snapToGrid, gridSize, isDraggingText]);

  const handleTextMouseUp = useCallback((e: MouseEvent) => {
    const state = textDragRef.current;
    if (!isDraggingText || !state.el) return;

    setIsDraggingText(false);

    // Obtener las dimensiones reales del texto contenido
    const contentNode = state.el.firstElementChild as HTMLElement;
    const textWidth = contentNode ? (contentNode.getBoundingClientRect().width / zoom) : 0;
    const textHeight = contentNode ? (contentNode.getBoundingClientRect().height / zoom) : 0;

    let limiteIzquierdoX = -(item.width / 2) + (textWidth / 2) + MARGENES_TEXTO.izquierdo;
    let limiteDerechoX = (item.width / 2) - (textWidth / 2) - MARGENES_TEXTO.derecho;
    let limiteArribaY = -(item.height / 2) + (textHeight / 2) + MARGENES_TEXTO.arriba;
    let limiteAbajoY = (item.height / 2) - (textHeight / 2) - MARGENES_TEXTO.abajo;

    const dx = (e.clientX - state.startX) / zoom;
    const dy = (e.clientY - state.startY) / zoom;

    let newX = state.initialOffsetX + dx;
    let newY = state.initialOffsetY + dy;

    newX = Math.max(limiteIzquierdoX, Math.min(newX, limiteDerechoX));
    newY = Math.max(limiteArribaY, Math.min(newY, limiteAbajoY));

    // Snap a la cuadrícula si está activada
    if (snapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    onUpdate({
      ...itemRef.current,
      textOffsetX: newX,
      textOffsetY: newY
    });
  }, [isDraggingText, item.width, item.height, zoom, onUpdate, snapToGrid, gridSize]);

  useEffect(() => {
    if (isDraggingText) {
      document.addEventListener('mousemove', handleTextMouseMove);
      document.addEventListener('mouseup', handleTextMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleTextMouseMove);
      document.removeEventListener('mouseup', handleTextMouseUp);
    };
  }, [isDraggingText, handleTextMouseMove, handleTextMouseUp]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !boardRef.current) return;

    e.preventDefault();
    const boardRect = boardRef.current.getBoundingClientRect();

    let currentRight = (e.clientX - boardRect.left) / zoom;
    let currentBottom = (e.clientY - boardRect.top) / zoom;

    let newWidth = currentRight - item.x;
    let newHeight = currentBottom - item.y;

    if (snapToGrid) {
      // Snap the absolute edge position to the grid
      const snappedRight = Math.round(currentRight / gridSize) * gridSize;
      const snappedBottom = Math.round(currentBottom / gridSize) * gridSize;
      newWidth = snappedRight - item.x;
      newHeight = snappedBottom - item.y;
    }

    newWidth = Math.max(40, newWidth);
    newHeight = Math.max(40, newHeight);

    if (dragRef.current) {
      dragRef.current.style.width = `${newWidth}px`;
      dragRef.current.style.height = `${newHeight}px`;
    }
  }, [isResizing, zoom, gridSize, snapToGrid, item.x, item.y]);

  const handleResizeMouseUp = useCallback((e: MouseEvent) => {
    if (!isResizing || !boardRef.current) return;

    setIsResizing(false);
    const boardRect = boardRef.current.getBoundingClientRect();
    let finalWidth = (e.clientX - boardRect.left) / zoom - item.x;
    let finalHeight = (e.clientY - boardRect.top) / zoom - item.y;

    if (snapToGrid) {
      const currentRight = (e.clientX - boardRect.left) / zoom;
      const currentBottom = (e.clientY - boardRect.top) / zoom;
      const snappedRight = Math.round(currentRight / gridSize) * gridSize;
      const snappedBottom = Math.round(currentBottom / gridSize) * gridSize;
      finalWidth = snappedRight - item.x;
      finalHeight = snappedBottom - item.y;
    }

    finalWidth = Math.max(40, finalWidth);
    finalHeight = Math.max(40, finalHeight);

    onUpdate({ ...itemRef.current, width: finalWidth, height: finalHeight });
  }, [isResizing, zoom, gridSize, snapToGrid, item.x, item.y, onUpdate]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  // Keep itemRef always in sync with the latest item prop (position, text, etc.)
  useEffect(() => {
    itemRef.current = item;
  }, [item]);

  // MOTOR RÍTMICO ULTRA-SIMPLIFICADO
  useEffect(() => {
    itemRef.current = item;

    const sequence = item.animationHueFilters || (item.secondaryBoxFilter ? [item.boxFilter || 'none', item.secondaryBoxFilter] : []);

    if (sequence.length > 1 && item.blinkInterval) {
      const intervalId = setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % sequence.length);

        if (item.secondaryImageUrl) {
          setCurrentImageUrl(prev => prev === item.imageUrl ? item.secondaryImageUrl! : item.imageUrl);
        }
      }, item.blinkInterval);

      return () => clearInterval(intervalId);
    } else {
      setCurrentImageUrl(item.imageUrl);
      setCurrentFrameIndex(0);
    }
  }, [
    item.id,
    item.imageUrl,
    item.secondaryImageUrl,
    item.boxFilter,
    item.secondaryBoxFilter,
    JSON.stringify(item.animationHueFilters),
    item.blinkInterval
  ]);

  // Filtro derivado del índice para sincronización atómica
  const activeSequence = item.animationHueFilters || (item.secondaryBoxFilter ? [item.boxFilter || 'none', item.secondaryBoxFilter] : []);
  const activeBoxFilter = activeSequence.length > 1
    ? activeSequence[currentFrameIndex % activeSequence.length]
    : (item.boxFilter || 'none');

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Checkear si es click derecho (2) para mover el texto libremente
    if (e.button === 2) {
      const now = Date.now();
      if (now - lastRightClickRef.current < 300) {
        // DOBLE CLICK DERECHO DETECTADO: Centrar texto y cancelar arrastre
        e.stopPropagation();
        e.preventDefault();
        onUpdate({ ...itemRef.current, textOffsetX: 0, textOffsetY: 0 });
        textDragRef.current.isDragging = false;
        setIsDraggingText(false);
        lastRightClickRef.current = 0;
        return;
      }
      lastRightClickRef.current = now;

      e.stopPropagation();
      e.preventDefault();
      const textContainer = dragRef.current?.querySelector('.text-container-move') as HTMLElement;
      if (textContainer) {
        textDragRef.current = {
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          initialOffsetX: item.textOffsetX || 0,
          initialOffsetY: item.textOffsetY || 0,
          el: textContainer
        };
        setIsDraggingText(true);
      }
      return;
    }

    // Permitir arrastrar el objeto única y exclusivamente con el click izquierdo (0)
    if (e.button !== 0) return;

    // Prevent dragging when clicking on a button inside the item
    if ((e.target as HTMLElement).closest('button')) return;

    if (connectingFromId && connectingFromId !== item.id) {
      if (onConnectComplete) {
        onConnectComplete(item.id);
        return;
      }
    }

    onSelect(item.id);

    if (!dragRef.current) return;

    // Store original positions for multi-drag
    if (isSelected && selectedItemIds.length > 1) {
      selectedItemIds.forEach(id => {
        const el = document.querySelector(`[data-item-id="${id}"]`) as HTMLElement;
        if (el) {
          el.setAttribute('data-original-x', el.style.left.replace('px', ''));
          el.setAttribute('data-original-y', el.style.top.replace('px', ''));
        }
      });
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const { x, y } = dragRef.current.getBoundingClientRect();
    offsetRef.current = { x: startX - x, y: startY - y };

    setIsDragging(true);
    if (setDragging) setDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !boardRef.current) return;

    e.preventDefault();
    const boardRect = boardRef.current.getBoundingClientRect();
    let newX = (e.clientX - boardRect.left - offsetRef.current.x) / zoom;
    let newY = (e.clientY - boardRect.top - offsetRef.current.y) / zoom;

    if (snapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    const dx = newX - item.x;
    const dy = newY - item.y;

    if (dragRef.current) {
      dragRef.current.style.left = `${newX}px`;
      dragRef.current.style.top = `${newY}px`;
    }

    // Multi-drag visual update
    if (isSelected && selectedItemIds.length > 1) {
      selectedItemIds.forEach(id => {
        if (id !== item.id) {
          const el = document.querySelector(`[data-item-id="${id}"]`) as HTMLElement | null;
          if (el) {
            const originalX = parseFloat(el.getAttribute('data-original-x') || el.style.left || '0');
            const originalY = parseFloat(el.getAttribute('data-original-y') || el.style.top || '0');
            el.style.left = `${originalX + dx}px`;
            el.style.top = `${originalY + dy}px`;

            // Update any DOM lines connected to these multi-selected items
            const elWidth = parseFloat(el.style.width || '200');
            const elHeight = parseFloat(el.style.height || '100');
            const elCenterX = originalX + dx + elWidth / 2;
            const elCenterY = originalY + dy + elHeight / 2;

            document.querySelectorAll(`line[data-from="${id}"]`).forEach(line => {
              line.setAttribute('x1', elCenterX.toString());
              line.setAttribute('y1', elCenterY.toString());
            });
            document.querySelectorAll(`line[data-to="${id}"]`).forEach(line => {
              line.setAttribute('x2', elCenterX.toString());
              line.setAttribute('y2', elCenterY.toString());
            });
          }
        }
      });
    }

    // Direct DOM connection updates for this specific item rendering efficiency
    const centerX = newX + item.width / 2;
    const centerY = newY + item.height / 2;

    document.querySelectorAll(`line[data-from="${item.id}"]`).forEach(line => {
      line.setAttribute('x1', centerX.toString());
      line.setAttribute('y1', centerY.toString());
    });

    document.querySelectorAll(`line[data-to="${item.id}"]`).forEach(line => {
      line.setAttribute('x2', centerX.toString());
      line.setAttribute('y2', centerY.toString());
    });

  }, [isDragging, zoom, gridSize, snapToGrid, item, isSelected, selectedItemIds]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging || !boardRef.current) return;

    setIsDragging(false);
    if (setDragging) setDragging(false);
    const boardRect = boardRef.current.getBoundingClientRect();
    let finalX = (e.clientX - boardRect.left - offsetRef.current.x) / zoom;
    let finalY = (e.clientY - boardRect.top - offsetRef.current.y) / zoom;

    if (snapToGrid) {
      finalX = Math.round(finalX / gridSize) * gridSize;
      finalY = Math.round(finalY / gridSize) * gridSize;
    }

    // Prevent position update if position hasn't changed to avoid re-render
    if (item.x !== finalX || item.y !== finalY) {
      onUpdate({ ...item, x: finalX, y: finalY });
    }
  }, [isDragging, boardRef, item, onUpdate, zoom, snapToGrid, gridSize]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMoveText = useCallback((dx: number, dy: number) => {
    const currentItem = itemRef.current;
    onUpdate({
      ...currentItem,
      textOffsetX: (currentItem.textOffsetX || 0) + dx,
      textOffsetY: (currentItem.textOffsetY || 0) + dy,
    });
  }, [onUpdate]);

  const handleMoveTextEnd = useCallback(() => {
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = null;
    }
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  }, []);

  const handleMoveTextStart = useCallback((dx: number, dy: number) => {
    handleMoveTextEnd(); // Clear previous timers
    handleMoveText(dx, dy); // Initial move

    moveTimeoutRef.current = window.setTimeout(() => {
      moveIntervalRef.current = window.setInterval(() => {
        handleMoveText(dx, dy);
      }, 50); // Fast interval for accelerated movement
    }, 300); // Delay before acceleration starts
  }, [handleMoveText, handleMoveTextEnd]);

  useEffect(() => {
    // Cleanup timers on component unmount
    return () => {
      handleMoveTextEnd();
    };
  }, [handleMoveTextEnd]);

  const textShadowStyle = (item.textShadow ?? true)
    ? `2px 2px ${item.textShadowColor || '#FFFFFF'}, -2px -2px ${item.textShadowColor || '#FFFFFF'}, 2px -2px ${item.textShadowColor || '#FFFFFF'}, -2px 2px ${item.textShadowColor || '#FFFFFF'}`
    : 'none';

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (item.type === ItemType.Timer && item.isTimerRunning) {
      const intervalId = setInterval(() => {
        const currentItem = itemRef.current;
        const newValue = currentItem.timerMode === 'chrono'
          ? (currentItem.timerValue || 0) + 1
          : (currentItem.timerValue || 0) - 1;

        onUpdate({
          ...currentItem,
          timerValue: newValue,
          text: formatTime(newValue)
        });
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [item.type, item.isTimerRunning, onUpdate]);

  const handleTimerToggle = () => {
    onUpdate({ ...item, isTimerRunning: !item.isTimerRunning });
  };

  const handleTimerReset = () => {
    const resetValue = item.timerMode === 'chrono' ? 0 : (item.timerInitialValue || 0);
    onUpdate({
      ...item,
      timerValue: resetValue,
      isTimerRunning: false,
      text: formatTime(resetValue)
    });
  };



  const handleDownloadFile = useCallback(() => {
    if (item.fileContent && item.fileName) {
      const blob = new Blob([item.fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [item.fileContent, item.fileName]);

  const isFrameItem = item.type === ItemType.Frame;

  const isTextEditable = (item.type === ItemType.Title || item.type === ItemType.Textbox || item.type === ItemType.Counter || item.type === ItemType.Timer || item.type === ItemType.File || item.type === ItemType.Checkbox || item.type === ItemType.PlainText || item.type === ItemType.Box) && !isFrameItem;
  const isMusicItem = item.type === ItemType.Music;
  const isCounterItem = item.type === ItemType.Counter;
  const isTimerItem = item.type === ItemType.Timer;
  const isCheckboxItem = item.type === ItemType.Checkbox;
  const isPlainTextItem = item.type === ItemType.PlainText;
  const isNineSliceItem = item.type === ItemType.Box;
  const isBoxItem = item.type === ItemType.Box;

  const handleCheckboxToggle = useCallback(() => {
    onUpdate({ ...item, checked: !item.checked });
  }, [item, onUpdate]);

  const handleCounterChange = useCallback((delta: number) => {
    const currentItem = itemRef.current;
    const newValue = (currentItem.counterValue || 0) + delta;
    onUpdate({
      ...currentItem,
      counterValue: newValue,
      text: String(newValue),
    });
  }, [onUpdate]);

  const transposeMusic = useCallback((direction: 'up' | 'down') => {
    const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const ROMAN_UPPER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

    const currentText = itemRef.current.text;

    // Check for Roman Numerals first
    const romanMatch = currentText.match(/^([ivIV]+)(.*)$/);
    if (romanMatch) {
      const numeral = romanMatch[1].toUpperCase();
      const suffix = romanMatch[2];
      const foundIndex = ROMAN_UPPER.indexOf(numeral);

      if (foundIndex !== -1) {
        const nextIndex = (foundIndex + (direction === 'up' ? 1 : -1) + 7) % 7;
        onUpdate({ ...itemRef.current, text: ROMAN_UPPER[nextIndex] + suffix });
        return;
      }
    }

    // Check for Chords/Notes
    const noteMatch = currentText.match(/^([A-G][#b]?)(.*)$/);
    if (noteMatch) {
      const root = noteMatch[1];
      const suffix = noteMatch[2];

      let index = SHARP_NOTES.indexOf(root);
      let useFlats = false;
      if (index === -1) {
        index = FLAT_NOTES.indexOf(root);
        useFlats = true;
      }

      if (index !== -1) {
        const nextIndex = (index + (direction === 'up' ? 1 : -1) + 12) % 12;
        const nextRoot = useFlats ? FLAT_NOTES[nextIndex] : SHARP_NOTES[nextIndex];
        onUpdate({ ...itemRef.current, text: nextRoot + suffix });
      }
    }
  }, [onUpdate]);

  const controlClasses = isMobileMode ? (isSelected ? 'opacity-100' : 'opacity-0') : 'opacity-0 group-hover:opacity-100';

  const neonGlowStyle = item.neonGlow
    ? (() => {
        const c = item.neonColor || '#00ff00';
        return {
          filter: [
            `drop-shadow(2px 2px 0 ${c})`,
            `drop-shadow(-2px -2px 0 ${c})`,
            `drop-shadow(2px -2px 0 ${c})`,
            `drop-shadow(-2px 2px 0 ${c})`,
            `drop-shadow(4px 0 0 ${c})`,
            `drop-shadow(-4px 0 0 ${c})`,
            `drop-shadow(0 4px 0 ${c})`,
            `drop-shadow(0 -4px 0 ${c})`,
          ].join(' ')
        };
      })()
    : {};

  const effectClasses = [
    item.neonGlow ? 'neon-text' : '',
    item.floating ? 'effect-floating' : '',
    item.glitch ? 'effect-glitch' : '',
    item.rainbow ? 'effect-rainbow' : '',
    item.scanlines ? 'effect-scanlines' : '',
    item.terminalScan ? 'effect-terminal-scan' : '',
    item.shake ? 'effect-shake' : '',
    item.pulse ? 'effect-pulse' : '',
    item.blur ? 'effect-blur' : '',
    item.staticNoise ? 'effect-static' : '',
    item.typewriter ? 'effect-typewriter' : '',
    item.breathing ? 'effect-breathing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={dragRef}
      data-item-id={item.id}
      className={`absolute group cursor-grab ${isSelected ? 'ring-4 ring-orange-500 ring-inset' : ''} ${isFrameItem ? 'pointer-events-none' : ''}`}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        outline: isHovered && !isSelected ? '4px solid rgba(255, 255, 255, 0.5)' : 'none',
        outlineOffset: '-4px',
        ...neonGlowStyle
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHoveredItemId(item.id)}
      onMouseLeave={() => setHoveredItemId(null)}
      onContextMenu={(e) => e.preventDefault()}
      onDoubleClick={(e) => {
        if (!(e.target as HTMLElement).closest('button')) {
          e.preventDefault();
          e.stopPropagation();
          if (item.textFragments && item.textFragments.length > 0) {
            setActiveFragmentIndex(0);
          }
          setIsEditingText(true);
          setTimeout(() => textEditRef.current?.focus(), 0);
        }
      }}
    >
      <div className={`relative w-full h-full bg-cover bg-center select-none ${isDragging ? 'cursor-grabbing' : ''} ${effectClasses}`}>
        {isFrameItem ? (
          // Marco 9-slice SIN relleno (centro transparente) para enmarcar elementos.
          // Solo el borde es clicable; el interior deja pasar los clics a lo que haya debajo.
          (() => {
            const s = item.borderSlice || { top: 16, right: 16, bottom: 16, left: 16 };
            const stripHandlers = {
              onMouseDown: handleMouseDown,
              onMouseEnter: () => setHoveredItemId(item.id),
              onMouseLeave: () => setHoveredItemId(null),
              onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
            };
            return (
              <>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    borderStyle: 'solid',
                    borderWidth: `${s.top}px ${s.right}px ${s.bottom}px ${s.left}px`,
                    borderImage: `url("${currentImageUrl}") ${s.top} ${s.right} ${s.bottom} ${s.left} stretch`,
                    imageRendering: 'pixelated',
                  }}
                />
                <div {...stripHandlers} className="absolute left-0 right-0 cursor-grab" style={{ top: 0, height: s.top, zIndex: 5 }} />
                <div {...stripHandlers} className="absolute left-0 right-0 cursor-grab" style={{ bottom: 0, height: s.bottom, zIndex: 5 }} />
                <div {...stripHandlers} className="absolute top-0 bottom-0 cursor-grab" style={{ left: 0, width: s.left, zIndex: 5 }} />
                <div {...stripHandlers} className="absolute top-0 bottom-0 cursor-grab" style={{ right: 0, width: s.right, zIndex: 5 }} />
              </>
            );
          })()
        ) : isNineSliceItem ? (
          // Renderizado 9-slice con border-image CSS
          (() => {
            const s = item.borderSlice || { top: 18, right: 31, bottom: 24, left: 28 };
            return (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderStyle: 'solid',
                  borderWidth: `${s.top}px ${s.right}px ${s.bottom}px ${s.left}px`,
                  borderImage: `url("${currentImageUrl}") ${s.top} ${s.right} ${s.bottom} ${s.left} fill stretch`,
                  imageRendering: 'pixelated',
                  filter: activeBoxFilter,
                }}
              />
            );
          })()
        ) : (
          !isPlainTextItem && <img src={currentImageUrl} alt="draggable item" className="w-full h-full pointer-events-none" referrerPolicy="no-referrer" style={{ filter: activeBoxFilter }} />
        )}
        <div
          className={`text-container-move absolute inset-0 p-4 flex items-center justify-center`}
          style={{
            transform: `translate(${item.textOffsetX || 0}px, ${item.textOffsetY || 0}px)`
          }}
        >
          <div className="flex items-center gap-2">
            {isCheckboxItem && (
              <div
                className={`w-6 h-6 border-2 border-current flex items-center justify-center cursor-pointer pointer-events-auto bg-white/10`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckboxToggle();
                }}
              >
                {item.checked && <div className="w-4 h-4 bg-current" />}
              </div>
            )}
            {isEditingText ? (
              <TextEditorWithStyles
                item={item}
                activeFragmentIndex={activeFragmentIndex}
                textEditRef={textEditRef}
                onUpdate={onUpdate}
                itemRef={itemRef}
                setIsEditingText={setIsEditingText}
              />
            ) : (
              <TextDisplay
                item={item}
                isBoxItem={isBoxItem}
                textShadowStyle={textShadowStyle}
                setActiveFragmentIndex={setActiveFragmentIndex}
                setIsEditingText={setIsEditingText}
                textEditRef={textEditRef}
              />
            )}
          </div>
        </div>
        {/* Resize Handle */}
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsResizing(true);
          }}
          className={`absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 transition-opacity pointer-events-auto ${controlClasses}`}
          style={{
            background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.4) 50%)',
            borderBottomRightRadius: '2px'
          }}
        />
      </div>

      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 transition-opacity z-10 pointer-events-auto flex-wrap justify-center ${controlClasses}`}>
        {/* Object controls */}
        <div className="flex items-center p-1 gap-1 pixel-box bg-black/70">
          {isFrameItem && (
            <button onClick={() => onEdit(item)} className="pixel-button p-1 bg-pink-600 hover:bg-pink-500" title="Cambiar Estilo del Marco">
              <PaletteIcon />
            </button>
          )}
          {(isTextEditable || isMusicItem) && (
            <>
              <button onClick={() => onEdit(item)} className="pixel-button p-1 bg-blue-600 hover:bg-blue-500" title="Editar Texto">
                <EditIcon />
              </button>
            </>
          )}
          <button onClick={() => onDuplicate(item.id)} className="pixel-button p-1 bg-green-600 hover:bg-green-500" title="Duplicar Elemento">
            <DuplicateIcon />
          </button>
          <button onClick={() => onSendToBack(item.id)} className="pixel-button p-1 bg-indigo-600 hover:bg-indigo-500" title="Enviar al Fondo">
            <SendToBackIcon />
          </button>
          {onConnectStart && (
            <button
              onMouseDown={(e) => {
                e.stopPropagation();
                if (connectingFromId === item.id && onConnectComplete) onConnectComplete(item.id);
                else onConnectStart(item.id);
              }}
              className={`pixel-button p-1 ${connectingFromId === item.id ? 'bg-orange-600 hover:bg-orange-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}
              title={connectingFromId === item.id ? "Cancelar Enlace" : "Enlazar con..."}
            >
              <LinkIcon />
            </button>
          )}
          <button 
            onClick={() => {
              onToggleInventory(item);
              if (!isInInventory) {
                setWasSaved(true);
                setTimeout(() => setWasSaved(false), 2000);
              }
            }} 
            className={`pixel-button p-1 transition-all duration-300 ${isInInventory ? 'bg-green-600' : 'bg-amber-600 hover:bg-amber-500'} ${wasSaved ? 'scale-110' : ''}`}
            title={isInInventory ? "Quitar del Inventario" : "Guardar en Inventario"}
          >
            {isInInventory ? <CheckboxIcon /> : <FileIcon />}
          </button>
          <button onClick={() => onDelete(item.id)} className="pixel-button p-1 bg-red-700 hover:bg-red-600" title="Eliminar Elemento">
            <DeleteIcon />
          </button>
        </div>

        {isTimerItem && (
          <div className="flex items-center p-1 gap-1 pixel-box bg-black/70">
            <button onClick={handleTimerToggle} className={`pixel-button p-1 ${item.isTimerRunning ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'}`} title={item.isTimerRunning ? "Pausar" : "Iniciar"}>
              {item.isTimerRunning ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button onClick={handleTimerReset} className="pixel-button p-1 bg-gray-600 hover:bg-gray-500" title="Reiniciar">
              <ResetIcon />
            </button>
          </div>
        )}
        {item.type === ItemType.File && (
          <div className="flex items-center p-1 gap-1 pixel-box bg-black/70">
            <button onClick={handleDownloadFile} className="pixel-button p-1 bg-green-600 hover:bg-green-500" title="Descargar Archivo">
              <DownloadIcon />
            </button>
          </div>
        )}
      </div>
      {/* Music / Counter controls */}
      {(isMusicItem || isCounterItem) && (
        <>
          <button
            onMouseDown={() => {
              if (isMusicItem) transposeMusic('up');
              else if (isCounterItem) handleCounterChange(1);
            }}
            onTouchStart={() => {
              if (isMusicItem) transposeMusic('up');
              else if (isCounterItem) handleCounterChange(1);
            }}
            className={`absolute -top-3 -left-3 z-20 pixel-button p-1 transition-opacity pointer-events-auto ${controlClasses}`}
            title={isMusicItem ? "Subir Tonalidad" : "Aumentar Contador"}
          >
            <DpadUpIcon />
          </button>
          <button
            onMouseDown={() => {
              if (isMusicItem) transposeMusic('down');
              else if (isCounterItem) handleCounterChange(-1);
            }}
            onTouchStart={() => {
              if (isMusicItem) transposeMusic('down');
              else if (isCounterItem) handleCounterChange(-1);
            }}
            className={`absolute -bottom-3 -right-3 z-20 pixel-button p-1 transition-opacity pointer-events-auto ${controlClasses}`}
            title={isMusicItem ? "Bajar Tonalidad" : "Disminuir Contador"}
          >
            <DpadDownIcon />
          </button>
        </>
      )}
    </div>
  );
};

const TextEditorWithStyles: React.FC<{
  item: BoardItem;
  activeFragmentIndex: number | null;
  textEditRef: React.RefObject<HTMLParagraphElement>;
  onUpdate: (item: BoardItem) => void;
  itemRef: React.MutableRefObject<BoardItem>;
  setIsEditingText: (v: boolean) => void;
}> = ({ item, activeFragmentIndex, textEditRef, onUpdate, itemRef, setIsEditingText }) => {
  const isFragmentMode = item.textFragments && item.textFragments.length > 0 && activeFragmentIndex !== null;
  const currentFrag = isFragmentMode ? item.textFragments[activeFragmentIndex] : null;
  const fragColor = currentFrag?.color || item.textColor || '#000000';
  const fragShadowColor = currentFrag?.shadowColor || item.textShadowColor || '#FFFFFF';
  const fragHasShadow = currentFrag?.hasShadow ?? item.textShadow ?? true;
  const fragShadowStyle = fragHasShadow 
    ? `2px 2px ${fragShadowColor}, -2px -2px ${fragShadowColor}, 2px -2px ${fragShadowColor}, -2px 2px ${fragShadowColor}`
    : 'none';

  return (
    <p
      ref={textEditRef}
      contentEditable
      suppressContentEditableWarning
      className={`whitespace-pre-wrap break-words pixel-text outline-none cursor-text pointer-events-auto`}
      style={{
        color: fragColor,
        fontFamily: item.fontFamily || 'inherit',
        textShadow: fragShadowStyle,
        fontSize: `${item.fontSize || 24}px`,
        lineHeight: 1.2,
        textAlign: item.textAlign || 'center',
        textTransform: item.textTransform || 'none',
        minWidth: '10px',
        caretColor: '#f97316',
      }}
      onBlur={(e) => {
        const newText = e.currentTarget.innerText;
        setIsEditingText(false);
        if (item.textFragments && item.textFragments.length > 0) {
          const newFragments = [...item.textFragments];
          if (activeFragmentIndex !== null && newFragments[activeFragmentIndex]) {
            newFragments[activeFragmentIndex] = { ...newFragments[activeFragmentIndex], text: newText };
            onUpdate({ ...itemRef.current, text: newFragments.map(f => f.text).join(''), textFragments: newFragments });
          }
        } else {
          if (newText !== item.text) {
            onUpdate({ ...itemRef.current, text: newText, textFragments: [] });
          }
        }
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          setIsEditingText(false);
          if (textEditRef.current) textEditRef.current.blur();
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {isFragmentMode ? item.textFragments[activeFragmentIndex]?.text || '' : item.text}
    </p>
  );
};

const TextDisplay: React.FC<{
  item: BoardItem;
  isBoxItem: boolean;
  textShadowStyle: string;
  setActiveFragmentIndex: (i: number) => void;
  setIsEditingText: (v: boolean) => void;
  textEditRef: React.RefObject<HTMLParagraphElement>;
}> = ({ item, isBoxItem, textShadowStyle, setActiveFragmentIndex, setIsEditingText, textEditRef }) => {
  return (
    <p
      className={`whitespace-pre-wrap break-words pixel-text`}
      style={{
        color: item.textColor || '#000000',
        fontFamily: item.fontFamily || 'inherit',
        textShadow: (item.textFragments && item.textFragments.length > 0) ? 'none' : textShadowStyle,
        fontSize: `${item.fontSize || 24}px`,
        lineHeight: 1.2,
        textAlign: item.textAlign || 'center',
        textTransform: item.textTransform || 'none',
        textDecoration: (isBoxItem && item.checked) ? 'line-through' : 'none',
        opacity: (isBoxItem && item.checked) ? 0.6 : 1,
      }}
    >
      {item.textFragments && item.textFragments.length > 0 ? (
        item.textFragments.map((frag, i) => {
          const fragShadowColor = frag.shadowColor || item.textShadowColor || '#FFFFFF';
          const fragHasShadow = frag.hasShadow ?? item.textShadow ?? true;
          const fragShadowStyle = fragHasShadow
            ? `2px 2px ${fragShadowColor}, -2px -2px ${fragShadowColor}, 2px -2px ${fragShadowColor}, -2px 2px ${fragShadowColor}`
            : 'none';
          return (
            <span 
              key={`frag-${i}`}
              data-fragment-index={i}
              style={{ color: frag.color || item.textColor || '#000000', textShadow: fragShadowStyle }}
              onClick={(e) => { e.stopPropagation(); setActiveFragmentIndex(i); }}
              onMouseDown={(e) => { e.stopPropagation(); }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveFragmentIndex(i);
                setIsEditingText(true);
                setTimeout(() => textEditRef.current?.focus(), 0);
              }}
              className="cursor-text"
            >
              {frag.text}
            </span>
          );
        })
      ) : (
        item.text
      )}
    </p>
  );
};

export default DraggableItem;