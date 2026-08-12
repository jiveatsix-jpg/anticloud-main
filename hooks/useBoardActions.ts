import React, { useCallback, useRef } from 'react';
import { ItemType, BoardItem, Board, TitleCollectionKey, TextboxCollectionKey } from '../types';
import { FONT_FACES, GRID_SIZE, DEFAULT_TEXTBOX_IMAGE_URLS, DEFAULT_BOX_IMAGE_URL, DEFAULT_BOX_BORDER_SLICE } from '../constants';
import { createNewBoard } from '../utils/boardUtils';
import { captureBoardToCanvas } from '../utils/canvasUtils';

interface UseBoardActionsProps {
  boards: Board[];
  setBoards: React.Dispatch<React.SetStateAction<Board[]>>;
  activeBoardIndex: number;
  viewportRef: React.RefObject<HTMLDivElement>;
  boardRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  pixelSizeMultiplier: string;
  spriteSizeMultiplier: string;
  setActiveModal: (modal: any) => void;
  selectedItemIds: string[];
  setSelectedItemIds: React.Dispatch<React.SetStateAction<string[]>>;
  clipboard: BoardItem[];
  setClipboard: React.Dispatch<React.SetStateAction<BoardItem[]>>;
  setIsCapturing: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingItem: React.Dispatch<React.SetStateAction<BoardItem | null>>;
  setTitleImages: React.Dispatch<React.SetStateAction<any>>;
  setTextboxImages: React.Dispatch<React.SetStateAction<any>>;
  setPixelImages: React.Dispatch<React.SetStateAction<any>>;
  setSpriteImages: React.Dispatch<React.SetStateAction<any>>;
  canvasOffsetX: number;
  canvasOffsetY: number;
  pushHistory?: (boards: Board[]) => void;
}

export const useBoardActions = ({
  boards,
  setBoards,
  activeBoardIndex,
  viewportRef,
  boardRef,
  zoom,
  pixelSizeMultiplier,
  spriteSizeMultiplier,
  setActiveModal,
  selectedItemIds,
  setSelectedItemIds,
  clipboard,
  setClipboard,
  setIsCapturing,
  setEditingItem,
  setTitleImages,
  setTextboxImages,
  setPixelImages,
  setSpriteImages,
  canvasOffsetX,
  canvasOffsetY,
  pushHistory
}: UseBoardActionsProps) => {

  const handleAddItem = useCallback((type: ItemType, imageUrl?: string, extraProps: Partial<BoardItem> = {}) => {
    console.log('handleAddItem called:', { type, imageUrl, extraProps });
    setActiveModal(null);
    if (pushHistory) pushHistory(boards);
    
    const createItem = (itemWidth: number, itemHeight: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      
      let finalWidth = extraProps.width || itemWidth;
      let finalHeight = extraProps.height || itemHeight;
      
      if (type === ItemType.Pixel || type === ItemType.Sprite) {
        const sizeMultiplier = type === ItemType.Pixel ? pixelSizeMultiplier : spriteSizeMultiplier;
        // Only apply multiplier if width/height were not explicitly overridden in extraProps
        if (!extraProps.width) {
          switch (sizeMultiplier) {
            case 'x1': finalWidth /= 2; finalHeight /= 2; break;
            case 'x1/2': finalWidth /= 4; finalHeight /= 4; break;
            case 'x1/4': finalWidth /= 8; finalHeight /= 8; break;
          }
        }
      }
      
      const boardRect = boardRef.current?.getBoundingClientRect();
      if (!boardRect) return;

      // Use the absolute window center to avoid any container-relative offsets
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Calculate logical position relative to the origin's current screen position
      const initialX = (centerX - boardRect.left) / zoom - (finalWidth / 2);
      const initialY = (centerY - boardRect.top) / zoom - (finalHeight / 2);
      
      const defaultText = type === ItemType.Counter ? '0' : (type === ItemType.Timer ? '00:00' : (type === ItemType.File ? 'Archivo' : (type === ItemType.Checkbox ? 'Tarea' : (type === ItemType.PlainText ? 'Texto' : (type === ItemType.Pixel || type === ItemType.Sprite ? '' : '¡Edítame!')))));

      const newItem: BoardItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        imageUrl: imageUrl || '',
        x: initialX,
        y: initialY,
        width: finalWidth,
        height: finalHeight,
        text: defaultText,
        counterValue: type === ItemType.Counter ? 0 : undefined,
        timerMode: type === ItemType.Timer ? 'chrono' : undefined,
        timerValue: type === ItemType.Timer ? 0 : undefined,
        timerInitialValue: type === ItemType.Timer ? 0 : undefined,
        isTimerRunning: type === ItemType.Timer ? false : undefined,
        fileName: type === ItemType.File ? 'archivo.txt' : undefined,
        fileContent: type === ItemType.File ? '' : undefined,
        checked: type === ItemType.Checkbox ? false : undefined,
        textColor: type === ItemType.PlainText ? '#FFFFFF' : '#000000',
        fontFamily: (type === ItemType.Title || type === ItemType.Textbox || type === ItemType.Counter || type === ItemType.Timer || type === ItemType.PlainText || type === ItemType.Box || type === ItemType.RichBox) ? FONT_FACES[1] : FONT_FACES[0],
        fontSize: 24,
        textShadow: type !== ItemType.PlainText,
        textShadowColor: '#FFFFFF',
        textOffsetX: 0,
        textOffsetY: 0,
        textAlign: 'center',
        textTransform: 'none',
        neonGlow: false,
        neonColor: '#00ffff',
        floating: false,
        glitch: false,
        rainbow: false,
        scanlines: false,
        pixelate: false,
        shake: false,
        pulse: false,
        blur: false,
        ...extraProps,
      };

      setBoards(prev => prev.map((board, index) => 
        index === activeBoardIndex ? { ...board, items: [...board.items, newItem] } : board
      ));
    };

    if (imageUrl) {
      const img = new Image();
      img.onload = () => createItem(img.naturalWidth, img.naturalHeight);
      img.onerror = () => createItem(250, 100);
      img.src = imageUrl;
    } else {
      createItem(250, 100);
    }
  }, [activeBoardIndex, viewportRef, zoom, pixelSizeMultiplier, spriteSizeMultiplier, setActiveModal, setBoards, canvasOffsetX, canvasOffsetY]);

  const handleBatchAddItems = useCallback((items: { type: ItemType, imageUrl: string, extraProps: Partial<BoardItem> }[]) => {
    setActiveModal(null);
    if (pushHistory) pushHistory(boards);
    const viewport = viewportRef.current;
    if (!viewport) return;

    const scrollLeft = viewport.scrollLeft;
    const scrollTop = viewport.scrollTop;
    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const newBoardItems: BoardItem[] = [];
    const now = Date.now();

    items.forEach((item, idx) => {
      const itemWidth = 250; 
      const itemHeight = 100;
      
      let initialX = (centerX - boardRect.left) / zoom - (itemWidth / 2);
      let initialY = (centerY - boardRect.top) / zoom - (itemHeight / 2);

      initialX += (idx - (items.length - 1) / 2) * (itemWidth + 20);

      const newItem: BoardItem = {
        id: `item_${now}_${idx}_${Math.random().toString(36).slice(2, 9)}`,
        type: item.type,
        imageUrl: item.imageUrl,
        x: initialX,
        y: initialY,
        width: itemWidth,
        height: itemHeight,
        text: '¡Edítame!',
        textColor: '#000000',
        fontFamily: FONT_FACES[1],
        fontSize: 24,
        textShadow: true,
        textShadowColor: '#FFFFFF',
        textOffsetX: 0,
        textOffsetY: 0,
        textAlign: 'center',
        textTransform: 'none',
        neonGlow: false,
        neonColor: '#00ffff',
        ...item.extraProps,
      };
      newBoardItems.push(newItem);
    });

    setBoards(prev => prev.map((board, index) => 
      index === activeBoardIndex ? { ...board, items: [...board.items, ...newBoardItems] } : board
    ));
  }, [activeBoardIndex, viewportRef, zoom, setActiveModal, setBoards, canvasOffsetX, canvasOffsetY]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    if (pushHistory) pushHistory(boards);
    const currentBoard = boards[activeBoardIndex];
    const currentItems = currentBoard?.items || [];
    
    let itemsToCenter: BoardItem[] = [];
    
    setBoards(prev => {
      const boardsCopy = [...prev];
      const boardToUpdate = boardsCopy[activeBoardIndex];
      if (!boardToUpdate) return prev;
      const itemsToDuplicate = boardToUpdate.items.filter(item => selectedItemIds.includes(item.id));
      const newItems = itemsToDuplicate.map(item => ({
        ...item,
        id: `item_${Date.now()}_${Math.random()}`,
        x: item.x + GRID_SIZE,
        y: item.y + GRID_SIZE,
      }));
      itemsToCenter = newItems;
      boardsCopy[activeBoardIndex] = { ...boardToUpdate, items: [...boardToUpdate.items, ...newItems] };
      return boardsCopy;
    });
  }, [activeBoardIndex, selectedItemIds, setBoards]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    if (pushHistory) pushHistory(boards);
    setBoards(prev => prev.map((board, index) => 
      index === activeBoardIndex ? { ...board, items: board.items.filter(item => !selectedItemIds.includes(item.id)) } : board
    ));
    setSelectedItemIds([]);
  }, [activeBoardIndex, selectedItemIds, setBoards, setSelectedItemIds]);

  const handleCopySelected = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const activeBoard = boards[activeBoardIndex];
    if (!activeBoard) return;
    const itemsToCopy = activeBoard.items.filter(item => selectedItemIds.includes(item.id));
    if (itemsToCopy.length > 0) {
      setClipboard(JSON.parse(JSON.stringify(itemsToCopy)));
    }
  }, [activeBoardIndex, boards, selectedItemIds, setClipboard]);

  const handlePaste = useCallback(() => {
    if (clipboard.length === 0) return;
    if (pushHistory) pushHistory(boards);
    const currentBoard = boards[activeBoardIndex];
    const currentItems = currentBoard?.items || [];
    
    let itemsToCenter: BoardItem[] = [];
    
    setBoards(prev => {
      const boardsCopy = [...prev];
      const boardToUpdate = boardsCopy[activeBoardIndex];
      if (!boardToUpdate) return prev;
      const newItems = clipboard.map((item, idx) => ({
        ...item,
        id: `item_${Date.now()}_${Math.random()}_${idx}`,
        x: item.x + 40,
        y: item.y + 40,
      }));
      itemsToCenter = newItems;
      boardsCopy[activeBoardIndex] = { ...boardToUpdate, items: [...boardToUpdate.items, ...newItems] };
      return boardsCopy;
    });
  }, [activeBoardIndex, clipboard, setBoards]);

  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (pushHistory) pushHistory(boards);
        setBoards(prev => prev.map((board, index) => 
          index === activeBoardIndex ? { ...board, backgroundUrl: url } : board
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAssetImages = (target: { type: 'title' | 'textbox' | 'pixel' | 'sprite'; key: string }, newImages: (string | null)[]) => {
    const setters: Record<string, any> = {
      title: setTitleImages,
      textbox: setTextboxImages,
      pixel: setPixelImages,
      sprite: setSpriteImages,
    };
    const setter = setters[target.type];
    if (setter) {
      if (target.type === 'pixel' || target.type === 'sprite') {
        setter((prev: any) => ({ 
          ...prev, 
          [target.key]: { ...prev[target.key], images: newImages } 
        }));
      } else {
        setter((prev: any) => ({ ...prev, [target.key]: newImages }));
      }
    }
  };

  const handleScreenshot = useCallback(async (captureArea?: { x: number; y: number; width: number; height: number }) => {
    if (!boardRef.current) return;
    setIsCapturing(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      const canvas = await captureBoardToCanvas(boards[activeBoardIndex], captureArea);
      const link = document.createElement('a');
      link.download = `pixel-board-capture-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Failed to capture board:", error);
      alert("Error al capturar la pizarra. Por favor, inténtalo de nuevo.");
    } finally {
      setIsCapturing(false);
    }
  }, [activeBoardIndex, boards, boardRef, setIsCapturing]);

  const handleStartEditItem = (item: BoardItem, fragmentIndex?: number) => {
    setBoards(prev => {
      const currentLength = prev.length;
      if (currentLength < 3) {
        const boardsToAdd = 3 - currentLength;
        const newBoardArray = [...prev];
        for (let i = 0; i < boardsToAdd; i++) newBoardArray.push(createNewBoard());
        return newBoardArray;
      }
      return prev;
    });
    const itemWithFragment = fragmentIndex !== undefined 
      ? { ...item, editingFragmentIndex: fragmentIndex } 
      : item;
    setEditingItem(itemWithFragment);
  };

  const handleAddCounter = useCallback(() => {
    setActiveModal('addCounter');
  }, [setActiveModal]);

  const handleAddTimer = useCallback(() => {
    setActiveModal('addTimer');
  }, [setActiveModal]);

  const handleAddFile = useCallback(() => {
    setActiveModal('addFile');
  }, [setActiveModal]);

  const handleAddCheckbox = useCallback(() => {
    setActiveModal('addCheckbox');
  }, [setActiveModal]);

  const handleAddPlainText = useCallback(() => {
    setActiveModal('addPlainText');
  }, [setActiveModal]);

  const handleAddBox = useCallback(() => {
    handleAddItem(ItemType.Box, DEFAULT_BOX_IMAGE_URL, {
      borderSlice: DEFAULT_BOX_BORDER_SLICE,
      width: 200,
      height: 80,
      text: '¡Edítame!',
    });
  }, [handleAddItem]);

  const handleAddRichBox = useCallback(() => {
    handleAddItem(ItemType.RichBox, DEFAULT_BOX_IMAGE_URL, {
      borderSlice: DEFAULT_BOX_BORDER_SLICE,
      text: '¡Doble click!',
      htmlContent: '<span>¡Doble click!</span>',
      width: 200,
      height: 80
    });
  }, [handleAddItem]);

  const handleResetCamera = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    
    // Target (0,0) logical origin accurately using absolute screen center
    const targetX = (canvasOffsetX * zoom) - (window.innerWidth / 2);
    const targetY = (canvasOffsetY * zoom) - (window.innerHeight / 2);

    viewport.scrollTo({
      left: targetX,
      top: targetY,
      behavior: 'smooth'
    });
  }, [viewportRef, zoom, canvasOffsetX, canvasOffsetY]);

  return {
    handleAddItem,
    handleAddCounter,
    handleAddTimer,
    handleAddFile,
    handleAddCheckbox,
    handleAddPlainText,
    handleAddBox,
    handleAddRichBox,
    handleBatchAddItems,
    handleDuplicateSelected,
    handleDeleteSelected,
    handleCopySelected,
    handlePaste,
    handleBackgroundFileChange,
    handleSaveAssetImages,
    handleScreenshot,
    handleStartEditItem,
    handleResetCamera
  };
};
