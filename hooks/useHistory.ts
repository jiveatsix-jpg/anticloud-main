import { useState, useCallback, useRef } from 'react';
import { Board } from '../types';

const MAX_HISTORY = 10;

export const useHistory = () => {
  const historyRef = useRef<Board[][]>([]);
  const indexRef = useRef(0);
  const [, forceUpdate] = useState(0);

  const pushHistory = useCallback((currentBoards: Board[]) => {
    const cloned = JSON.parse(JSON.stringify(currentBoards));
    
    // Slice to current index to remove redo history, then push new state
    historyRef.current = historyRef.current.slice(0, indexRef.current);
    historyRef.current.push(cloned);
    
    // Limit to MAX_HISTORY
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    
    indexRef.current = historyRef.current.length - 1;
    forceUpdate(n => n + 1);
  }, []);

  const undo = useCallback((): Board[] | null => {
    if (indexRef.current > 0) {
      indexRef.current -= 1;
      forceUpdate(n => n + 1);
      return historyRef.current[indexRef.current];
    }
    return null;
  }, []);

  const redo = useCallback((): Board[] | null => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current += 1;
      forceUpdate(n => n + 1);
      return historyRef.current[indexRef.current];
    }
    return null;
  }, []);

  const canUndo = indexRef.current > 0;
  const canRedo = indexRef.current < historyRef.current.length - 1;

  return {
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo
  };
};