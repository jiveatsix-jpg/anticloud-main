import { useState, useCallback, useRef } from 'react';
import { Board } from '../types';

const MAX_HISTORY = 10;

export const useHistory = () => {
  const [history, setHistory] = useState<Board[][]>([]);
  const indexRef = useRef(0);
  const [, forceUpdate] = useState(0);

  const index = indexRef.current;

  const pushHistory = useCallback((currentBoards: Board[]) => {
    const cloned = JSON.parse(JSON.stringify(currentBoards));
    
    setHistory(prev => {
      const newHistory = prev.slice(0, indexRef.current);
      newHistory.push(cloned);
      
      if (newHistory.length > MAX_HISTORY) {
        return newHistory.slice(1);
      }
      return newHistory;
    });
    
    indexRef.current += 1;
    forceUpdate(n => n + 1);
  }, []);

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current -= 1;
      forceUpdate(n => n + 1);
      return history[indexRef.current];
    }
    return null;
  }, [history]);

  const getUndoState = useCallback(() => {
    if (indexRef.current > 0) {
      return history[indexRef.current - 1];
    }
    return null;
  }, [history, index]);

  const redo = useCallback(() => {
    if (indexRef.current < history.length - 1) {
      indexRef.current += 1;
      forceUpdate(n => n + 1);
      return history[indexRef.current];
    }
    return null;
  }, [history, index]);

  const getRedoState = useCallback(() => {
    if (indexRef.current < history.length - 1) {
      return history[indexRef.current + 1];
    }
    return null;
  }, [history, index]);

  const canUndo = indexRef.current > 0;
  const canRedo = indexRef.current < history.length - 1;

  return {
    pushHistory,
    undo,
    redo,
    getUndoState,
    getRedoState,
    canUndo,
    canRedo
  };
};