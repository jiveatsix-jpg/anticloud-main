import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Board, BoardItem } from '../types';
import { createNewBoard, isValidBoard } from '../utils/boardUtils';
import { GRID_SIZE } from '../constants';
import { storage } from '../utils/storageUtils';
import { useHistory } from './useHistory';

export const useBoards = () => {
  const [isBoardsLoaded, setIsBoardsLoaded] = useState(false);
  const [boards, setBoards] = useState<Board[]>([createNewBoard()]);
  const [activeBoardIndex, setActiveBoardIndex] = useState(0);

  const { pushHistory, undo, redo, canUndo, canRedo } = useHistory();
  
  const boardsRef = useRef(boards);
  boardsRef.current = boards;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedBoards, savedIndex] = await Promise.all([
          storage.getItem('pixelBoard_savedBoards'),
          storage.getItem('pixelBoard_activeBoardIndex'),
        ]);
        if (savedBoards) {
          const parsed = JSON.parse(savedBoards);
          if (Array.isArray(parsed)) {
            const validBoards = parsed.filter(isValidBoard);
            if (validBoards.length > 0) setBoards(validBoards);
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
    if (isBoardsLoaded) storage.setItem('pixelBoard_savedBoards', JSON.stringify(boards));
  }, [boards, isBoardsLoaded]);

  useEffect(() => {
    if (isBoardsLoaded) storage.setItem('pixelBoard_activeBoardIndex', String(activeBoardIndex));
  }, [activeBoardIndex, isBoardsLoaded]);

  useEffect(() => {
    if (activeBoardIndex >= boards.length) {
      setActiveBoardIndex(0);
    }
  }, [boards.length, activeBoardIndex]);

  const handleUpdateItem = useCallback((updatedItem: BoardItem, selectedItemIds: string[]) => {
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
              return { ...item, x: item.x + dx, y: item.y + dy };
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

  const handleAddBoard = useCallback(() => {
    pushHistory(boards);
    setBoards(prev => [...prev, createNewBoard()]);
  }, [boards, pushHistory]);

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
      return {
        ...board,
        connections: [...connections, { id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, fromId, toId, color: 'var(--pixel-highlight-color, #ffaa00)' }]
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
    handleRemoveBoard,
    handleUpdateBoardSettings,
    handleAddConnection,
    handleRemoveConnection,
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
    boardsRef
  };
};