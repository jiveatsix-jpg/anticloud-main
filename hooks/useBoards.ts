import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Board, BoardItem, BoardSize, StorageNotice } from '../types';
import { createNewBoard, generateBoardId, isValidBoard } from '../utils/boardUtils';
import { GRID_SIZE } from '../constants';
import { storage } from '../utils/storageUtils';
import { saveRecoveryBackup } from '../utils/slotStorage';
import { useHistory } from './useHistory';
import { getConnectionSide } from '../utils/canvasUtils';

export const useBoards = () => {
  const [isBoardsLoaded, setIsBoardsLoaded] = useState(false);
  const [boards, setBoards] = useState<Board[]>([createNewBoard()]);
  const [activeBoardIndex, setActiveBoardIndex] = useState(0);

  const { pushHistory, undo, redo, canUndo, canRedo } = useHistory();
  
  const boardsRef = useRef(boards);
  boardsRef.current = boards;
  // Set when stored boards could not be read AND could not be backed up; saving is then skipped so the original survives.
  const persistBlockedRef = useRef(false);
  const [storageNotice, setStorageNotice] = useState<StorageNotice | null>(null);
  const dismissStorageNotice = useCallback(() => setStorageNotice(null), []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedBoardsRead, savedIndex] = await Promise.all([
          storage.tryGetItem('pixelBoard_savedBoards'),
          storage.getItem('pixelBoard_activeBoardIndex'),
        ]);
        const savedBoards = savedBoardsRead.value;
        // We know nothing about what is stored, so the blank default must not overwrite it.
        if (savedBoardsRead.failed && savedBoards === null) {
          persistBlockedRef.current = true;
          setStorageNotice({ kind: 'read-failed' });
        }
        if (savedBoards) {
          let validBoards: Board[] = [];
          let fullyReadable = false;
          try {
            const parsed = JSON.parse(savedBoards);
            if (Array.isArray(parsed)) {
              validBoards = parsed.filter(isValidBoard);
              fullyReadable = validBoards.length === parsed.length;
            }
          } catch (e) {
            console.error("ANTI_CLOUD: Las pizarras guardadas no se pudieron interpretar", e);
          }
          if (validBoards.length > 0) setBoards(validBoards);
          // The persist effect below overwrites the stored value with whatever we loaded, so anything
          // we could not read in full has to be backed up first or it is lost for good.
          if (!fullyReadable) {
            try {
              await saveRecoveryBackup(savedBoards);
              setStorageNotice({ kind: 'recovered' });
            } catch (e) {
              persistBlockedRef.current = true;
              setStorageNotice({ kind: 'backup-failed' });
              console.error("ANTI_CLOUD: Sin respaldo no se sobrescriben las pizarras guardadas en esta sesión", e);
            }
          }
        }
        if (savedIndex) {
          const index = parseInt(savedIndex, 10);
          if (!isNaN(index)) setActiveBoardIndex(index);
        }
      } catch (e) {
        console.error("ANTI_CLOUD: Fallo al cargar los tableros", e);
      } finally {
        setIsBoardsLoaded(true);
      }
    };
    loadData();
  }, []);

  const activeBoard = boards[activeBoardIndex] || boards[0];

  useEffect(() => {
    if (isBoardsLoaded && !persistBlockedRef.current) storage.setItem('pixelBoard_savedBoards', JSON.stringify(boards));
  }, [boards, isBoardsLoaded]);

  useEffect(() => {
    if (isBoardsLoaded) storage.setItem('pixelBoard_activeBoardIndex', String(activeBoardIndex));
  }, [activeBoardIndex, isBoardsLoaded]);

  useEffect(() => {
    if (activeBoardIndex >= boards.length) {
      setActiveBoardIndex(0);
    }
  }, [boards.length, activeBoardIndex]);

  const handleUpdateItem = useCallback((updatedItem: BoardItem, selectedItemIds: string[], snapToGrid?: boolean, gridSize?: number) => {
    pushHistory(boards);
    setBoards(prev => prev.map((board, index) => {
      if (index !== activeBoardIndex) return board;
      const oldItem = board.items.find(i => i.id === updatedItem.id);
      if (!oldItem) return board;
      const dx = updatedItem.x - oldItem.x;
      const dy = updatedItem.y - oldItem.y;
      if (selectedItemIds.includes(updatedItem.id) && selectedItemIds.length > 1 && (dx !== 0 || dy !== 0)) {
        return {
          ...board,
          items: board.items.map(item => {
            if (selectedItemIds.includes(item.id)) {
              if (item.id === updatedItem.id) return updatedItem;
              // Snap each secondary item to the universal grid independently instead of just
              // carrying over the primary item's raw delta, so a group move doesn't leave the
              // others off-grid.
              let newX = item.x + dx;
              let newY = item.y + dy;
              if (snapToGrid && gridSize) {
                newX = Math.round(newX / gridSize) * gridSize;
                newY = Math.round(newY / gridSize) * gridSize;
              }
              return { ...item, x: newX, y: newY };
            }
            return item;
          })
        };
      }
      return { ...board, items: board.items.map(item => item.id === updatedItem.id ? updatedItem : item) };
    }));
  }, [activeBoardIndex, boards, pushHistory]);

  const handleDeleteItem = useCallback((id: string, setSelectedItemIds: React.Dispatch<React.SetStateAction<string[]>>, setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>) => {
    pushHistory(boards);
    setBoards(prev => prev.map((board, index) =>
      index === activeBoardIndex
        ? { ...board, items: board.items.filter(item => item.id !== id) }
        : board
    ));
    setSelectedItemIds(prev => prev.filter(itemId => itemId !== id));
    setSelectedItemId(prev => prev === id ? null : prev);
  }, [activeBoardIndex, boards, pushHistory]);

  const handleDuplicateItem = useCallback((id: string) => {
    pushHistory(boards);
    setBoards(prev => {
      const boardsCopy = [...prev];
      const boardToUpdate = boardsCopy[activeBoardIndex];
      if (!boardToUpdate) return prev;
      const itemToDuplicate = boardToUpdate.items.find(item => item.id === id);
      if (!itemToDuplicate) return prev;
      const newItem: BoardItem = {
        ...itemToDuplicate,
        id: `item_${Date.now()}_${Math.random()}`,
        x: itemToDuplicate.x + GRID_SIZE,
        y: itemToDuplicate.y + GRID_SIZE,
      };
      const newItems = [...boardToUpdate.items, newItem];
      boardsCopy[activeBoardIndex] = { ...boardToUpdate, items: newItems };
      return boardsCopy;
    });
  }, [activeBoardIndex, boards, pushHistory]);

  const handleSendItemToBack = useCallback((id: string) => {
    pushHistory(boards);
    setBoards(prev => prev.map((board, index) => {
      if (index !== activeBoardIndex) return board;
      const items = [...board.items];
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex > 0) {
        const [item] = items.splice(itemIndex, 1);
        items.unshift(item);
      }
      return { ...board, items };
    }));
  }, [activeBoardIndex, boards, pushHistory]);

  const handleReorderItem = useCallback((id: string, direction: 'up' | 'down' | 'front' | 'back') => {
    pushHistory(boards);
    setBoards(prev => prev.map((board, index) => {
      if (index !== activeBoardIndex) return board;
      const items = [...board.items];
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex === -1) return board;
      const [item] = items.splice(itemIndex, 1);
      if (direction === 'up') {
        const newIndex = Math.min(items.length, itemIndex + 1);
        items.splice(newIndex, 0, item);
      } else if (direction === 'down') {
        const newIndex = Math.max(0, itemIndex - 1);
        items.splice(newIndex, 0, item);
      } else if (direction === 'front') {
        items.push(item);
      } else if (direction === 'back') {
        items.unshift(item);
      }
      return { ...board, items };
    }));
  }, [activeBoardIndex, boards, pushHistory]);

  const handleSendItemToBoard = useCallback((itemId: string, targetBoardIndex: number) => {
    if (targetBoardIndex === activeBoardIndex) return;
    pushHistory(boards);
    setBoards(prevBoards => {
      const currentBoard = prevBoards[activeBoardIndex];
      const itemToSend = currentBoard.items.find(item => item.id === itemId);
      if (!itemToSend) return prevBoards;
      const newBoards = [...prevBoards];
      newBoards[activeBoardIndex] = { ...currentBoard, items: currentBoard.items.filter(item => item.id !== itemId) };
      const destinationBoard = newBoards[targetBoardIndex];
      newBoards[targetBoardIndex] = { ...destinationBoard, items: [...destinationBoard.items, itemToSend] };
      return newBoards;
    });
  }, [activeBoardIndex, boards, pushHistory]);

  const handleAddBoard = useCallback((size?: BoardSize) => {
    pushHistory(boards);
    setBoards(prev => [...prev, createNewBoard(size?.width, size?.height)]);
  }, [boards, pushHistory]);

  // Appends copies of `incoming` as new boards (one undo step) and activates the first of them; never
  // replaces existing boards. Reads boardsRef because callers (slot loading) invoke it after an await,
  // when a render closure could be stale.
  const handleImportBoards = useCallback((incoming: Board[]) => {
    if (incoming.length === 0) return;
    const current = boardsRef.current;
    const usedIds = new Set(current.map(b => b.id));
    const imported = incoming.map((board): Board => {
      let id = generateBoardId();
      while (usedIds.has(id)) id = generateBoardId();
      usedIds.add(id);
      return { ...JSON.parse(JSON.stringify(board)), id };
    });
    pushHistory(current);
    setBoards(prev => [...prev, ...imported]);
    setActiveBoardIndex(current.length);
  }, [pushHistory]);

  const handleImportBoard = useCallback((board: Board) => handleImportBoards([board]), [handleImportBoards]);

  const handleRemoveBoard = useCallback((index: number) => {
    pushHistory(boards);
    setBoards(prev => {
      if (prev.length <= 1) return prev;
      const newBoards = prev.filter((_, i) => i !== index);
      if (activeBoardIndex >= newBoards.length) {
        setActiveBoardIndex(newBoards.length - 1);
      }
      return newBoards;
    });
  }, [activeBoardIndex, boards, pushHistory]);

  const handleGroupItems = useCallback((itemIds: string[]) => {
    if (itemIds.length < 2) return;
    pushHistory(boards);
    const groupId = `group-${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    setBoards(prev => prev.map((board, index) =>
      index === activeBoardIndex
        ? { ...board, items: board.items.map(item => itemIds.includes(item.id) ? { ...item, groupId } : item) }
        : board
    ));
  }, [activeBoardIndex, boards, pushHistory]);

  const handleUngroupItems = useCallback((itemIds: string[]) => {
    pushHistory(boards);
    setBoards(prev => prev.map((board, index) =>
      index === activeBoardIndex
        ? { ...board, items: board.items.map(item => itemIds.includes(item.id) ? { ...item, groupId: undefined } : item) }
        : board
    ));
  }, [activeBoardIndex, boards, pushHistory]);

  const handleUpdateBoardSettings = useCallback((settings: Partial<Board>) => {
    pushHistory(boards);
    setBoards(prev => prev.map((board, index) =>
      index === activeBoardIndex ? { ...board, ...settings } : board
    ));
  }, [activeBoardIndex, boards, pushHistory]);

  const handleAddConnection = useCallback((fromId: string, toId: string) => {
    pushHistory(boards);
    setBoards(prev => prev.map((board, index) => {
      if (index !== activeBoardIndex) return board;
      const connections = board.connections || [];
      if (fromId === toId || connections.some(c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId))) {
        return board;
      }
      const fromItem = board.items.find(i => i.id === fromId);
      const toItem = board.items.find(i => i.id === toId);
      // Lock the anchor side in at creation time from the items' current
      // positions, so it stays put afterwards instead of re-anchoring as
      // either item moves -- only recreating the connection changes it.
      const fromSide = fromItem && toItem ? getConnectionSide(fromItem, toItem) : undefined;
      const toSide = fromItem && toItem ? getConnectionSide(toItem, fromItem) : undefined;
      return {
        ...board,
        connections: [...connections, { id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, fromId, toId, fromSide, toSide, color: 'var(--pixel-highlight-color, #ffaa00)' }]
      };
    }));
  }, [activeBoardIndex, boards, pushHistory]);

  const handleRemoveConnection = useCallback((connectionId: string) => {
    pushHistory(boards);
    setBoards(prev => prev.map((board, index) => {
      if (index !== activeBoardIndex) return board;
      return { ...board, connections: (board.connections || []).filter(c => c.id !== connectionId) };
    }));
  }, [activeBoardIndex, boards, pushHistory]);

  return {
    isBoardsLoaded,
    boards,
    setBoards,
    activeBoardIndex,
    setActiveBoardIndex,
    activeBoard,
    handleUpdateItem,
    handleDeleteItem,
    handleDuplicateItem,
    handleSendItemToBack,
    handleReorderItem,
    handleGroupItems,
    handleUngroupItems,
    handleSendItemToBoard,
    handleAddBoard,
    handleImportBoard,
    handleImportBoards,
    handleRemoveBoard,
    handleUpdateBoardSettings,
    handleAddConnection,
    handleRemoveConnection,
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
    boardsRef,
    storageNotice,
    dismissStorageNotice
  };
};