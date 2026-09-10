import { useState, useEffect, useRef } from 'react';
import { BoardItem, TitleCollectionKey, TextboxCollectionKey } from '../types';
import { THEMES } from '../constants';
import { storage } from '../utils/storageUtils';

export type ModalState =
  | 'addTitle'
  | 'addTextbox'
  | 'addPixel'
  | 'addSprite'
  | 'addCounter'
  | 'addTimer'
  | 'addFile'
  | 'addCheckbox'
  | 'addPlainText'
  | 'addChord'
  | 'addHarmonization'
  | 'generateElement'
  | 'changeTitleImage'
  | 'changeTextboxImage'
  | { type: 'editTitleImages'; key: TitleCollectionKey; returnTo?: 'addTitle' | 'changeTitleImage' }
  | { type: 'editTextboxImages'; key: TextboxCollectionKey; returnTo?: 'addTextbox' | 'changeTextboxImage' }
  | { type: 'editPixelImages'; key: string }
  | { type: 'editSpriteImages'; key: string }
  | 'suggestions'
  | 'boardSettings'
  | 'layers'
  | 'inventory'
  | 'uiManager'
  | null;

export const useUIState = () => {
  const [isUILoaded, setIsUILoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showScreenshotOptions, setShowScreenshotOptions] = useState(false);
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number; } | null>(null);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [multiSelectRect, setMultiSelectRect] = useState<{ x: number; y: number; width: number; height: number; } | null>(null);
  const [clipboard, setClipboard] = useState<BoardItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalState>(null);
  const [editingItem, setEditingItem] = useState<BoardItem | null>(null);
  const [inventory, setInventory] = useState<BoardItem[]>([]);
  const [activeThemeIndex, setActiveThemeIndex] = useState(0);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [connectionPointerCoord, setConnectionPointerCoord] = useState<{x: number; y: number} | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0, clientX: 0, clientY: 0 });

  const categoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mobile, inv, themeIdx, tutorialCompleted] = await Promise.all([
          storage.getItem('pixelBoard_mobileMode'),
          storage.getItem('pixelBoard_inventory'),
          storage.getItem('pixelBoard_themeIndex'),
          storage.getItem('pixelBoard_tutorialCompleted'),
        ]);
        if (mobile) setIsMobileMode(mobile === 'true');
        if (inv) setInventory(JSON.parse(inv));
        if (themeIdx) setActiveThemeIndex(parseInt(themeIdx, 10));
        if (!tutorialCompleted) setIsTutorialActive(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsUILoaded(true);
      }
    };
    loadData();
  }, []);

  const handleCategoryEnter = (category: string) => {
    if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current);
    setActiveCategory(category);
  };

  const handleCategoryLeave = () => {
    categoryTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 300);
  };

  useEffect(() => {
    if (isUILoaded) storage.setItem('pixelBoard_mobileMode', String(isMobileMode));
  }, [isMobileMode, isUILoaded]);

  useEffect(() => {
    if (isUILoaded) storage.setItem('pixelBoard_inventory', JSON.stringify(inventory));
  }, [inventory, isUILoaded]);

  useEffect(() => {
    const theme = THEMES[activeThemeIndex];
    if (theme) {
      Object.entries(theme.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value as string);
      });
      if (isUILoaded) storage.setItem('pixelBoard_themeIndex', String(activeThemeIndex));
    }
  }, [activeThemeIndex, isUILoaded]);

  return {
    isUILoaded,
    zoom, setZoom,
    isGridVisible, setIsGridVisible,
    isCapturing, setIsCapturing,
    showScreenshotOptions, setShowScreenshotOptions,
    isSelectingArea, setIsSelectingArea,
    selectionRect, setSelectionRect,
    isMobileMode, setIsMobileMode,
    selectedItemId, setSelectedItemId,
    selectedItemIds, setSelectedItemIds,
    isMultiSelectMode, setIsMultiSelectMode,
    multiSelectRect, setMultiSelectRect,
    clipboard, setClipboard,
    activeCategory, handleCategoryEnter, handleCategoryLeave,
    activeModal, setActiveModal,
    editingItem, setEditingItem,
    inventory, setInventory,
    activeThemeIndex, setActiveThemeIndex,
    isTutorialActive, setIsTutorialActive,
    tutorialStep, setTutorialStep,
    connectingFromId, setConnectingFromId,
    connectionPointerCoord, setConnectionPointerCoord,
    hoveredItemId, setHoveredItemId,
    mouseCoords, setMouseCoords
  };
};
