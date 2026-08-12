import React, { useRef, useEffect } from 'react';
import { ItemType, TitleCollectionKey, TextboxCollectionKey, AssetCategory, BoardItem } from './types';
import { FONT_FACES, THEMES } from './constants';
import AddElementModal from './components/AddElementModal';
import AddChordModal from './components/AddChordModal';
import AddHarmonizationModal from './components/AddHarmonizationModal';
import EditImagesModal from './components/EditImagesModal';

import TextEditModal from './components/TextEditModal';
import FrameEditModal from './components/FrameEditModal';
import BoardSettingsModal from './components/BoardSettingsModal';
import LayersModal from './components/LayersModal';
import InventoryModal from './components/InventoryModal';
import SuggestionsModal from './components/SuggestionsModal';
import TutorialGuide, { TUTORIAL_STEPS } from './components/TutorialGuide';
import {
  PlusIcon, MusicIcon, LayersIcon, FileIcon, SettingsIcon, CameraIcon,
  BoardNextIcon, SelectIcon, SmartphoneIcon, HelpIcon, SuggestionIcon, GridIcon, HomeIcon
} from './components/Icons';
import Modal from './components/Modal';
import Toolbar from './components/Toolbar';
import BoardCanvas from './components/BoardCanvas';

import { useBoards } from './hooks/useBoards';
import { useAssets } from './hooks/useAssets';
import { useUIState } from './hooks/useUIState';
import { useCanvasEvents } from './hooks/useCanvasEvents';
import { useBoardActions } from './hooks/useBoardActions';
import { storage } from './utils/storageUtils';

const App: React.FC = () => {
  const {
    isBoardsLoaded,
    boards, setBoards, activeBoardIndex, setActiveBoardIndex, activeBoard,
    handleUpdateItem, handleDeleteItem, handleDuplicateItem,
    handleSendItemToBack, handleReorderItem, handleGroupItems, handleUngroupItems, handleSendItemToBoard, handleAddBoard, handleRemoveBoard,
    handleUpdateBoardSettings, handleAddConnection, handleRemoveConnection,
    canUndo, canRedo, undo, redo, pushHistory, boardsRef
  } = useBoards();

  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  const setBoardsRef = useRef(setBoards);

  undoRef.current = undo;
  redoRef.current = redo;
  setBoardsRef.current = setBoards;

  const {
    isInitializing, titleImages, setTitleImages, textboxImages, setTextboxImages,
    pixelImages, setPixelImages, spriteImages, setSpriteImages,
    activeTitleKey, setActiveTitleKey, activeTextboxKey, setActiveTextboxKey,
    activeCounterKey, setActiveCounterKey,
    activeTimerKey, setActiveTimerKey,
    activeCheckboxKey, setActiveCheckboxKey,
    activePlainTextKey, setActivePlainTextKey,
    activePixelKey, setActivePixelKey, activeSpriteKey, setActiveSpriteKey,
    pixelSizeMultiplier, setPixelSizeMultiplier, spriteSizeMultiplier, setSpriteSizeMultiplier,
    renamePixelCategory, renameSpriteCategory
  } = useAssets();

  const {
    isUILoaded,
    zoom, setZoom, isGridVisible, setIsGridVisible, isCapturing, setIsCapturing,
    showScreenshotOptions, setShowScreenshotOptions, isSelectingArea, setIsSelectingArea,
    selectionRect, setSelectionRect, isMobileMode, setIsMobileMode,
    selectedItemId, setSelectedItemId, selectedItemIds, setSelectedItemIds,
    isMultiSelectMode, setIsMultiSelectMode, multiSelectRect, setMultiSelectRect,
    clipboard, setClipboard, activeCategory, handleCategoryEnter, handleCategoryLeave,
    activeModal, setActiveModal, editingItem, setEditingItem,
    inventory, setInventory,
    activeThemeIndex, setActiveThemeIndex, isTutorialActive, setIsTutorialActive,
    tutorialStep, setTutorialStep,
    connectingFromId, setConnectingFromId,
    connectionPointerCoord, setConnectionPointerCoord,
    hoveredItemId, setHoveredItemId,
    mouseCoords, setMouseCoords
  } = useUIState();

  const viewportRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const disketteInputRef = useRef<HTMLInputElement>(null);

  const handleExportToDisk = () => {
    const data = {
      boards,
      pixelImages,
      spriteImages,
      inventory,
      activeThemeIndex
    };
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pixel_board_save_${Date.now()}.anticloud`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFromDisk = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const parsed = JSON.parse(result);

        if (parsed.boards) setBoards(parsed.boards);
        if (parsed.pixelImages) setPixelImages(parsed.pixelImages);
        if (parsed.spriteImages) setSpriteImages(parsed.spriteImages);
        if (parsed.inventory) setInventory(parsed.inventory);
        if (parsed.activeThemeIndex !== undefined) setActiveThemeIndex(parsed.activeThemeIndex);

        alert("¡Tierra Firme sincronizada! Datos del disquete (.anticloud) cargados con éxito.");
      } catch (error) {
        console.error("ANTI_CLOUD Error al leer disquete:", error);
        alert("El disquete (.anticloud) está dañado o es ilegible.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // STABLE offsets - these MUST NOT depend on item positions or we get a feedback loop
  const canvasOffsetX = 10000;
  const canvasOffsetY = 10000;
  const canvasWidth = 20000;
  const canvasHeight = 20000;

  const {
    handleAddItem, handleAddCounter, handleAddTimer, handleAddFile, handleAddCheckbox, handleAddPlainText, handleAddBox, handleAddFrame, handleBatchAddItems, handleDuplicateSelected, handleDeleteSelected, handleCopySelected,
    handlePaste, handleBackgroundFileChange, handleSaveAssetImages,
    handleScreenshot, handleStartEditItem
  } = useBoardActions({
    boards, setBoards, activeBoardIndex, viewportRef, boardRef, zoom,
    pixelSizeMultiplier, spriteSizeMultiplier, setActiveModal,
    selectedItemIds, setSelectedItemIds, clipboard, setClipboard,
    selectedItemId, setSelectedItemId,
    setIsCapturing, setEditingItem, setTitleImages, setTextboxImages,
    setPixelImages, setSpriteImages,
    canvasOffsetX, canvasOffsetY, pushHistory
  });

  const copyRef = useRef(handleCopySelected);
  const pasteRef = useRef(handlePaste);
  const duplicateRef = useRef(handleDuplicateSelected);
  const deleteSelectedRef = useRef(handleDeleteSelected);
  const setSelectedItemIdRef = useRef(setSelectedItemId);
  const setSelectedItemIdsRef = useRef(setSelectedItemIds);
  const zoomRef = useRef(zoom);
  const setZoomRef = useRef(setZoom);

  copyRef.current = handleCopySelected;
  pasteRef.current = handlePaste;
  duplicateRef.current = handleDuplicateSelected;
  deleteSelectedRef.current = handleDeleteSelected;
  setSelectedItemIdRef.current = setSelectedItemId;
  setSelectedItemIdsRef.current = setSelectedItemIds;
  zoomRef.current = zoom;
  setZoomRef.current = setZoom;

  const {
    handleCenterContent, handlePanMouseDown, handlePanTouchStart, handleSelectionMouseDown,
    handleMoveStart, handleMoveEnd, handlePanMouseMove, handlePanMouseUp,
    handlePanTouchMove, handlePanTouchEnd, handleSelectionMouseMove,
    handleSelectionMouseUp, handleMultiSelectMouseMove, handleMultiSelectMouseUp
  } = useCanvasEvents({
    zoom, setZoom, viewportRef, boardRef, isMultiSelectMode, isGridVisible,
    setSelectedItemId, setSelectedItemIds, setMultiSelectRect, setSelectionRect,
    setIsSelectingArea, activeBoard, onScreenshot: handleScreenshot,
    canvasOffsetX, canvasOffsetY
  });

  const handleThemeChange = () => {
    setActiveThemeIndex(prevIndex => (prevIndex + 1) % THEMES.length);
  };

  const handleStartTutorial = () => {
    setTutorialStep(0);
    setIsTutorialActive(true);
  };

  const handleAddItemWithLog = (type: ItemType, imageUrl?: string, extraProps?: any) => {
    console.log('Adding item from App:', { type, imageUrl, extraProps });
    handleAddItem(type, imageUrl, extraProps);
  };

  const handleNextTutorialStep = () => {
    setTutorialStep(prev => {
      const nextStep = prev + 1;
      if (nextStep >= TUTORIAL_STEPS.length) {
        handleSkipTutorial();
        return prev;
      }
      return nextStep;
    });
  };

  const handlePrevTutorialStep = () => {
    setTutorialStep(prev => Math.max(0, prev - 1));
  };

  const handleSkipTutorial = () => {
    setIsTutorialActive(false);
    localStorage.setItem('pixelBoard_tutorialCompleted', 'true');
  };

  useEffect(() => {
    if (!isTutorialActive) return;

    // Map tutorial steps to toolbar categories that need to be open
    const stepToCategory: Record<number, string | null> = {
      1: 'add',
      2: 'add',
      3: 'add',
      4: 'add',
      5: 'add',
      7: 'music',
      8: 'music',
      10: 'config',
      11: 'config',
      13: 'config',
    };

    const category = stepToCategory[tutorialStep];
    if (category) {
      handleCategoryEnter(category);
    } else {
      handleCategoryLeave();
    }
  }, [tutorialStep, isTutorialActive, handleCategoryEnter, handleCategoryLeave]);

  // Ctrl mantenido invierte el estado de la cuadrícula; al soltar, vuelve al original
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' && !e.repeat) {
        setIsGridVisible(prev => !prev);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsGridVisible(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [setIsGridVisible]);

  useEffect(() => {
    const cleanup = () => {
      document.removeEventListener('mousemove', handlePanMouseMove);
      document.removeEventListener('mouseup', handlePanMouseUp);
      document.removeEventListener('touchmove', handlePanTouchMove);
      document.removeEventListener('touchend', handlePanTouchEnd);
      document.removeEventListener('mousemove', handleSelectionMouseMove);
      document.removeEventListener('mouseup', handleSelectionMouseUp);
      document.removeEventListener('mousemove', handleMultiSelectMouseMove);
      document.removeEventListener('mouseup', handleMultiSelectMouseUp);
    };
    return cleanup;
  }, [handlePanMouseMove, handlePanMouseUp, handlePanTouchMove, handlePanTouchEnd, handleSelectionMouseMove, handleSelectionMouseUp, handleMultiSelectMouseMove, handleMultiSelectMouseUp]);

  const toggleInventory = (item: BoardItem) => {
    setInventory(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      return [...prev, { ...item }];
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si estamos escribiendo en un input o textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) return;

      if (e.key === 'Delete') {
        if (selectedItemIds.length > 0) {
          e.preventDefault();
          deleteSelectedRef.current();
        } else if (hoveredItemId) {
          e.preventDefault();
          handleDeleteItem(hoveredItemId, setSelectedItemIds, setSelectedItemId);
          setHoveredItemId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hoveredItemId, handleDeleteItem, setSelectedItemIds, setSelectedItemId, setHoveredItemId, selectedItemIds]);

  // Debug: F10 to clear all data and reload
  useEffect(() => {
    const handleDebugKey = async (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        await storage.clearAll();
        window.location.reload();
      }
    };
    window.addEventListener('keydown', handleDebugKey);
    return () => window.removeEventListener('keydown', handleDebugKey);
  }, []);

  // Undo/Redo: Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const handleUndoRedo = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) return;

      if (e.ctrlKey && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        const prevBoards = undoRef.current(boardsRef.current);
        if (prevBoards) setBoardsRef.current(prevBoards);
      } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z') && e.shiftKey) {
        e.preventDefault();
        const nextBoards = redoRef.current();
        if (nextBoards) setBoardsRef.current(nextBoards);
      }
    };
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, []);

  // Keyboard shortcuts: copy/paste/duplicate, zoom, deselect
  useEffect(() => {
    const zoomBy = (factor: number) => {
      const viewport = viewportRef.current;
      const boardEl = boardRef.current;
      if (!viewport || !boardEl) return;
      const viewportRect = viewport.getBoundingClientRect();
      const centerX = viewportRect.left + viewportRect.width / 2;
      const centerY = viewportRect.top + viewportRect.height / 2;
      const mouseX = centerX - viewportRect.left;
      const mouseY = centerY - viewportRect.top;
      const boardRefRect = boardEl.getBoundingClientRect();
      const boardX = (centerX - boardRefRect.left) / zoomRef.current;
      const boardY = (centerY - boardRefRect.top) / zoomRef.current;
      const newZoom = Math.max(0.1, Math.min(zoomRef.current * factor, 5));
      if (newZoom !== zoomRef.current) {
        setZoomRef.current(newZoom);
        viewport.scrollLeft = (boardX + canvasOffsetX) * newZoom - mouseX;
        viewport.scrollTop = (boardY + canvasOffsetY) * newZoom - mouseY;
      }
    };

    const handleShortcutKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) return;

      if (e.key === 'Escape') {
        setSelectedItemIdRef.current(null);
        setSelectedItemIdsRef.current([]);
        return;
      }

      if (e.ctrlKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          copyRef.current();
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          pasteRef.current();
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          duplicateRef.current();
        } else if (e.key === '+' || e.key === '=' || e.key === 'Add') {
          e.preventDefault();
          zoomBy(1.1);
        } else if (e.key === '-' || e.key === 'Subtract') {
          e.preventDefault();
          zoomBy(0.9);
        }
      }
    };

    window.addEventListener('keydown', handleShortcutKeyDown);
    return () => window.removeEventListener('keydown', handleShortcutKeyDown);
  }, [canvasOffsetX, canvasOffsetY]);

  const hasInitializedCamera = useRef(false);

  // Center camera on initial load
  useEffect(() => {
    if (isBoardsLoaded && isUILoaded && viewportRef.current && !hasInitializedCamera.current) {
      // Use a timeout to ensure the DOM has fully updated its dimensions and layout
      const timer = setTimeout(() => {
        const viewport = viewportRef.current;
        // Target (0,0) logical origin accurately using absolute screen center
        const targetX = (canvasOffsetX * zoom) - (window.innerWidth / 2);
        const targetY = (canvasOffsetY * zoom) - (window.innerHeight / 2);
        
        viewport.scrollTo({
          left: targetX,
          top: targetY,
          behavior: 'auto' // Instant on first load
        });
        
        hasInitializedCamera.current = true;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isBoardsLoaded, isUILoaded, canvasOffsetX, canvasOffsetY, zoom]);

  return (
    <div
      className="relative w-screen h-screen bg-black overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {(isInitializing || !isBoardsLoaded || !isUILoaded) && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[9999]">
          <p className="text-4xl font-bold text-white neon-text animate-pulse">Cargando Tierra Firme...</p>
        </div>
      )}
      {isCapturing && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <p className="text-4xl text-white animate-pulse">Capturando pizarra...</p>
        </div>
      )}

      {/* Mouse Coordinates Indicator (Debug) */}
      <div 
        className="fixed pointer-events-none z-[9999] text-[10px] font-mono text-cyan-400 bg-black/60 px-1.5 py-0.5 rounded border border-cyan-500/30 backdrop-blur-sm"
        style={{ 
          left: `${mouseCoords.clientX + 15}px`, 
          top: `${mouseCoords.clientY + 15}px`,
          display: isBoardsLoaded ? 'block' : 'none'
        }}
      >
        {Math.round(mouseCoords.x)}, {Math.round(mouseCoords.y)}
      </div>

      <input
        type="file"
        ref={backgroundInputRef}
        className="hidden"
        onChange={handleBackgroundFileChange}
        accept="image/png, image/jpeg, image/gif"
      />
      <input
        type="file"
        ref={disketteInputRef}
        className="hidden"
        onChange={handleImportFromDisk}
        accept=".anticloud"
      />

      {isSelectingArea && (
        <div
          className="absolute inset-0 z-30 cursor-crosshair bg-black/30"
          onMouseDown={handleSelectionMouseDown}
        />
      )}

      <BoardCanvas
        viewportRef={viewportRef}
        boardRef={boardRef}
        activeBoard={activeBoard}
        zoom={zoom}
        isGridVisible={isGridVisible}
        isMultiSelectMode={isMultiSelectMode}
        handlePanMouseDown={handlePanMouseDown}
        handlePanTouchStart={handlePanTouchStart}
        handleUpdateItem={handleUpdateItem}
        handleDeleteItem={handleDeleteItem}
        handleDuplicateItem={handleDuplicateItem}
        handleStartEditItem={handleStartEditItem}
        handleSendItemToBack={handleSendItemToBack}
        onToggleInventory={toggleInventory}
        inventory={inventory}
        isMobileMode={isMobileMode}
        selectedItemId={selectedItemId}
        selectedItemIds={selectedItemIds}
        setSelectedItemId={setSelectedItemId}
        setSelectedItemIds={setSelectedItemIds}
        selectionRect={selectionRect}
        multiSelectRect={multiSelectRect}
        connectingFromId={connectingFromId}
        setConnectingFromId={setConnectingFromId}
        connectionPointerCoord={connectionPointerCoord}
        setConnectionPointerCoord={setConnectionPointerCoord}
        handleAddConnection={handleAddConnection}
        handleRemoveConnection={handleRemoveConnection}
        setHoveredItemId={setHoveredItemId}
        hoveredItemId={hoveredItemId}
        canvasOffsetX={canvasOffsetX}
        canvasOffsetY={canvasOffsetY}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        setMouseCoords={setMouseCoords}
      />

      {/* Floating Home Button */}
      <div className="absolute top-16 right-6 z-40">
        <button
          onClick={handleCenterContent}
          className="p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white/70 hover:text-white hover:bg-white/10 hover:border-white/40 shadow-xl transition-all group overflow-hidden"
          title="Centrar en el contenido"
        >
          <div className="relative z-10">
            <HomeIcon />
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      <Toolbar
        isMobileMode={isMobileMode}
        activeCategory={activeCategory}
        handleCategoryEnter={handleCategoryEnter}
        handleCategoryLeave={handleCategoryLeave}
        setActiveCategory={handleCategoryEnter}
        setActiveModal={setActiveModal}
        backgroundInputRef={backgroundInputRef}
        isGridVisible={isGridVisible}
        setIsGridVisible={setIsGridVisible}
        handleThemeChange={handleThemeChange}
        showScreenshotOptions={showScreenshotOptions}
        setShowScreenshotOptions={setShowScreenshotOptions}
        handleScreenshot={handleScreenshot}
        setIsSelectingArea={setIsSelectingArea}
        activeBoardIndex={activeBoardIndex}
        boardsCount={boards.length}
        setActiveBoardIndex={setActiveBoardIndex}
        handleAddBoard={handleAddBoard}
        handleRemoveBoard={handleRemoveBoard}
        isMultiSelectMode={isMultiSelectMode}
        setIsMultiSelectMode={setIsMultiSelectMode}
        selectedItemIds={selectedItemIds}
        handleDuplicateSelected={handleDuplicateSelected}
        handleDeleteSelected={handleDeleteSelected}
        handleCopySelected={handleCopySelected}
        handlePaste={handlePaste}
        handleGroupItems={handleGroupItems}
        handleUngroupItems={handleUngroupItems}
        handleAddCounter={handleAddCounter}
        handleAddTimer={handleAddTimer}
        handleAddFile={handleAddFile}
        handleAddCheckbox={handleAddCheckbox}
        handleAddPlainText={handleAddPlainText}
        handleAddBox={handleAddBox}
        handleAddFrame={handleAddFrame}
        setIsMobileMode={setIsMobileMode}
        handleStartTutorial={handleStartTutorial}
        handleExportToDisk={handleExportToDisk}
        disketteInputRef={disketteInputRef}
      />



      {/* Modals */}
      {activeModal === 'addCounter' && (
        <AddElementModal
          title="Añadir Contador"
          onClose={() => setActiveModal(null)}
          images={titleImages[activeCounterKey]}
          showCollectionSelector={true}
          collectionKeys={['x1/2', 'x1']}
          activeCollectionKey={activeCounterKey}
          onCollectionChange={(key) => setActiveCounterKey(key as TitleCollectionKey)}
          onAdd={(imageUrl) => handleAddItemWithLog(ItemType.Counter, imageUrl)}
          onEditImages={(key) => setActiveModal({ type: 'editTitleImages', key: key as TitleCollectionKey })}
        />
      )}

      {activeModal === 'addTimer' && (
        <AddElementModal
          title="Añadir Cronómetro / Temporizador"
          onClose={() => setActiveModal(null)}
          images={titleImages[activeTimerKey]}
          showCollectionSelector={true}
          collectionKeys={['x1/2', 'x1']}
          activeCollectionKey={activeTimerKey}
          onCollectionChange={(key) => setActiveTimerKey(key as TitleCollectionKey)}
          onAdd={(imageUrl) => handleAddItemWithLog(ItemType.Timer, imageUrl, {
            timerMode: 'chrono',
            timerValue: 0,
            timerInitialValue: 0,
            isTimerRunning: false,
            text: '00:00'
          })}
          onEditImages={(key) => setActiveModal({ type: 'editTitleImages', key: key as TitleCollectionKey })}
        />
      )}

      {activeModal === 'addFile' && (
        <AddElementModal
          title="Añadir Archivo Inteligente"
          onClose={() => setActiveModal(null)}
          images={titleImages['x1']}
          showCollectionSelector={false}
          onAdd={(imageUrl) => handleAddItemWithLog(ItemType.File, imageUrl, {
            fileName: 'archivo.txt',
            fileContent: '',
            text: 'Archivo'
          })}
        />
      )}

      {activeModal === 'addCheckbox' && (
        <AddElementModal
          title="Añadir Checkbox"
          onClose={() => setActiveModal(null)}
          images={titleImages[activeCheckboxKey]}
          showCollectionSelector={true}
          collectionKeys={['x1/2', 'x1']}
          activeCollectionKey={activeCheckboxKey}
          onCollectionChange={(key) => setActiveCheckboxKey(key as TitleCollectionKey)}
          onAdd={(imageUrl) => handleAddItemWithLog(ItemType.Checkbox, imageUrl, {
            checked: false,
            text: 'Tarea'
          })}
          onEditImages={(key) => setActiveModal({ type: 'editTitleImages', key: key as TitleCollectionKey })}
        />
      )}

      {activeModal === 'addPlainText' && (
        <AddElementModal
          title="Añadir Texto Plano"
          onClose={() => setActiveModal(null)}
          images={titleImages[activePlainTextKey]}
          showCollectionSelector={true}
          collectionKeys={['x1/2', 'x1', 'x2', 'x3', 'x4']}
          activeCollectionKey={activePlainTextKey}
          onCollectionChange={(key) => setActivePlainTextKey(key as TitleCollectionKey)}
          onAdd={(imageUrl) => handleAddItemWithLog(ItemType.PlainText, imageUrl, {
            text: 'Texto',
            textColor: '#FFFFFF',
            textShadow: false
          })}
          onEditImages={(key) => setActiveModal({ type: 'editTitleImages', key: key as TitleCollectionKey })}
        />
      )}

      {activeModal === 'addTitle' && (
        <AddElementModal
          title="Añadir Título"
          onClose={() => setActiveModal(null)}
          images={titleImages[activeTitleKey]}
          showCollectionSelector={true}
          collectionKeys={['x1/2', 'x1', 'x2', 'x3', 'x4']}
          activeCollectionKey={activeTitleKey}
          onCollectionChange={(key) => setActiveTitleKey(key as TitleCollectionKey)}
          onAdd={(imageUrl) => handleAddItemWithLog(ItemType.Title, imageUrl)}
          onEditImages={(key) => setActiveModal({ type: 'editTitleImages', key: key as TitleCollectionKey })}
        />
      )}

      {activeModal === 'addTextbox' && (
        <AddElementModal
          title="Añadir Caja de Texto"
          onClose={() => setActiveModal(null)}
          images={textboxImages[activeTextboxKey]}
          showCollectionSelector={true}
          collectionKeys={['x1', 'x4', 'x16']}
          activeCollectionKey={activeTextboxKey}
          onCollectionChange={(key) => setActiveTextboxKey(key as TextboxCollectionKey)}
          onAdd={(imageUrl) => handleAddItemWithLog(ItemType.Textbox, imageUrl)}
          onEditImages={(key) => setActiveModal({ type: 'editTextboxImages', key: key as TextboxCollectionKey })}
        />
      )}

      {activeModal === 'addPixel' && (
        <AddElementModal
          title="Añadir Ilustración"
          onClose={() => setActiveModal(null)}
          images={pixelImages[activePixelKey].images}
          collectionKeys={Object.keys(pixelImages)}
          activeCollectionKey={activePixelKey}
          onCollectionChange={(key) => setActivePixelKey(key)}
          collectionNames={Object.fromEntries(Object.entries(pixelImages).map(([k, v]) => [k, (v as AssetCategory).name]))}
          onRenameCollection={renamePixelCategory}
          onAdd={(imageUrl) => handleAddItemWithLog(ItemType.Pixel, imageUrl)}
          onEditImages={(key) => setActiveModal({ type: 'editPixelImages', key })}
          showSizeMultiplier={true}
          sizeMultiplier={pixelSizeMultiplier}
          onSizeMultiplierChange={setPixelSizeMultiplier}
        />
      )}

      {activeModal === 'addSprite' && (
        <AddElementModal
          title="Añadir Sprite"
          onClose={() => setActiveModal(null)}
          images={spriteImages[activeSpriteKey].images}
          collectionKeys={Object.keys(spriteImages)}
          activeCollectionKey={activeSpriteKey}
          onCollectionChange={(key) => setActiveSpriteKey(key)}
          collectionNames={Object.fromEntries(Object.entries(spriteImages).map(([k, v]) => [k, (v as AssetCategory).name]))}
          onRenameCollection={renameSpriteCategory}
          onAdd={(imageUrl) => handleAddItemWithLog(ItemType.Sprite, imageUrl)}
          onEditImages={(key) => setActiveModal({ type: 'editSpriteImages', key })}
          showSizeMultiplier={true}
          sizeMultiplier={spriteSizeMultiplier}
          onSizeMultiplierChange={setSpriteSizeMultiplier}
        />
      )}

      {activeModal === 'addChord' && (
        <AddChordModal
          collections={titleImages}
          onClose={() => setActiveModal(null)}
          onAdd={(chordName, imageUrl, color, shadowColor) => {
            handleAddItem(ItemType.Music, imageUrl, {
              text: chordName,
              textColor: color,
              textShadowColor: shadowColor,
              textShadow: true
            });
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === 'addHarmonization' && (
        <AddHarmonizationModal
          collections={titleImages}
          onClose={() => setActiveModal(null)}
          onAdd={(chords) => {
            const items = chords.map(chord => ({
              type: ItemType.Music,
              imageUrl: chord.imageUrl,
              extraProps: {
                text: chord.name,
                textColor: chord.color,
                textShadowColor: chord.shadowColor,
                textShadow: true
              }
            }));
            handleBatchAddItems(items);
            setActiveModal(null);
          }}
        />
      )}


      {activeModal && typeof activeModal === 'object' && activeModal.type === 'editTitleImages' && (
        <EditImagesModal
          onClose={() => setActiveModal(activeModal.returnTo || 'addTitle')}
          onApply={(newImages) => handleSaveAssetImages({ type: 'title', key: activeModal.key }, newImages)}
          images={titleImages[activeModal.key]}
          type="title"
          title={`Editar Imágenes de Título (${activeModal.key})`}
        />
      )}

      {activeModal && typeof activeModal === 'object' && activeModal.type === 'editTextboxImages' && (
        <EditImagesModal
          onClose={() => setActiveModal(activeModal.returnTo || 'addTextbox')}
          onApply={(newImages) => handleSaveAssetImages({ type: 'textbox', key: activeModal.key }, newImages)}
          images={textboxImages[activeModal.key]}
          type="textbox"
          title={`Editar Imágenes de Caja de Texto (${activeModal.key})`}
        />
      )}

      {activeModal && typeof activeModal === 'object' && activeModal.type === 'editPixelImages' && (
        <EditImagesModal
          onClose={() => setActiveModal('addPixel')}
          onApply={(newImages) => handleSaveAssetImages({ type: 'pixel', key: activeModal.key }, newImages)}
          images={pixelImages[activeModal.key]?.images || []}
          type="pixel"
          title={`Editar Imágenes de Ilustración (${activeModal.key})`}
        />
      )}

      {activeModal && typeof activeModal === 'object' && activeModal.type === 'editSpriteImages' && (
        <EditImagesModal
          onClose={() => setActiveModal('addSprite')}
          onApply={(newImages) => handleSaveAssetImages({ type: 'sprite', key: activeModal.key }, newImages)}
          images={spriteImages[activeModal.key]?.images || []}
          type="sprite"
          title={`Editar Imágenes de Sprite (${activeModal.key})`}
        />
      )}

      {activeModal === 'boardSettings' && (
        <BoardSettingsModal
          board={activeBoard}
          onClose={() => setActiveModal(null)}
          onSave={handleUpdateBoardSettings}
        />
      )}

      {activeModal === 'suggestions' && (
        <SuggestionsModal
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'layers' && (
        <LayersModal
          items={activeBoard.items}
          onClose={() => setActiveModal(null)}
          onReorder={handleReorderItem}
          onDelete={(id) => handleDeleteItem(id, setSelectedItemIds, setSelectedItemId)}
          onSelect={(id) => {
            setSelectedItemId(id);
            setSelectedItemIds([]);
          }}
          selectedItemIds={selectedItemIds}
        />
      )}

      {activeModal === 'inventory' && (
        <InventoryModal
          inventory={inventory}
          onClose={() => setActiveModal(null)}
          onAddItem={(item) => {
            const { id, ...rest } = item;
            handleAddItem(item.type, item.imageUrl, { ...rest });
            setActiveModal(null);
          }}
          onRemoveItem={(id) => setInventory(prev => prev.filter(i => i.id !== id))}
        />
      )}

      {editingItem && editingItem.type === ItemType.Frame && (
        <FrameEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(updated) => {
            handleUpdateItem(updated, selectedItemIds);
            setEditingItem(null);
          }}
        />
      )}

      {editingItem && editingItem.type !== ItemType.Frame && (
        <TextEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(updated) => {
            handleUpdateItem(updated, selectedItemIds);
            setEditingItem(null);
          }}
          boardsLength={boards.length}
          activeBoardIndex={activeBoardIndex}
          onSendToBoard={handleSendItemToBoard}
          titleImages={titleImages}
          textboxImages={textboxImages}
          activeFragmentIndex={editingItem.editingFragmentIndex}
        />
      )}

      {isTutorialActive && (
        <TutorialGuide
          step={tutorialStep}
          onNext={handleNextTutorialStep}
          onPrev={handlePrevTutorialStep}
          onSkip={handleSkipTutorial}
        />
      )}
    </div>
  );
};

export default App;
