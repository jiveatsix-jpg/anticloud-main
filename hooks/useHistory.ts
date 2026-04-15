import { useState, useCallback, useRef } from 'react';
import { Board } from '../types';

export const useHistory = () => {
  const historyRef = useRef<Board[][]>([]);
  const indexRef = useRef(0);
  const [, forceUpdate] = useState(0);

  const pushHistory = useCallback((currentBoards: Board[]) => {
    const cloned = JSON.parse(JSON.stringify(currentBoards));
    console.log('[HISTORY] pushHistory', { clonedLength: cloned.length, itemCount: cloned[0]?.items.length });
    
    // Remove any future states if we're not at the end (new timeline)
    historyRef.current = historyRef.current.slice(0, indexRef.current);
    historyRef.current.push(cloned);
    
    indexRef.current = historyRef.current.length;
    console.log('[HISTORY] after push', { index: indexRef.current, length: historyRef.current.length });
    forceUpdate(n => n + 1);
  }, []);

  const undo = useCallback((): Board[] | null => {
    console.log('[HISTORY] undo', { index: indexRef.current, length: historyRef.current.length });
    if (indexRef.current > 1) {
      indexRef.current -= 1;
      const result = historyRef.current[indexRef.current - 1];
      console.log('[HISTORY] undo result', { index: indexRef.current, itemCount: result?.[0]?.items.length });
      forceUpdate(n => n + 1);
      return result;
    }
    return null;
  }, []);

  const redo = useCallback((): Board[] | null => {
    console.log('[HISTORY] redo', { index: indexRef.current, length: historyRef.current.length });
    if (indexRef.current < historyRef.current.length) {
      const result = historyRef.current[indexRef.current];
      indexRef.current += 1;
      console.log('[HISTORY] redo result', { index: indexRef.current, itemCount: result?.[0]?.items.length });
      forceUpdate(n => n + 1);
      return result;
    }
    return null;
  }, []);

  const canUndo = () => indexRef.current > 1;
  const canRedo = () => indexRef.current < historyRef.current.length;

  return {
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    getIndex: () => indexRef.current,
    getHistoryLength: () => historyRef.current.length
  };
};