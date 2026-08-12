import { useState, useCallback, useRef } from 'react';
import { Board } from '../types';

export const useHistory = () => {
  const historyRef = useRef<Board[][]>([]);
  const indexRef = useRef(0);
  const isOperatingRef = useRef(false);
  const [, forceUpdate] = useState(0);

  const pushHistory = useCallback((currentBoards: Board[]) => {
    const cloned = JSON.parse(JSON.stringify(currentBoards));

    historyRef.current = historyRef.current.slice(0, indexRef.current);
    historyRef.current.push(cloned);

    indexRef.current = historyRef.current.length;
    forceUpdate(n => n + 1);
  }, []);

  const undo = useCallback((currentBoards: Board[]): Board[] | null => {
    if (isOperatingRef.current || indexRef.current <= 0) return null;
    isOperatingRef.current = true;

    // The state produced by the most recent edit is only ever held in live
    // component state, never in historyRef (pushHistory stores the state
    // *before* each edit). Capture it here, the first time we step back
    // from the tip, so redo() has somewhere to go back to.
    if (indexRef.current === historyRef.current.length) {
      historyRef.current.push(JSON.parse(JSON.stringify(currentBoards)));
    }

    indexRef.current -= 1;
    const result = historyRef.current[indexRef.current];
    forceUpdate(n => n + 1);
    setTimeout(() => { isOperatingRef.current = false; }, 50);
    return result;
  }, []);

  const redo = useCallback((): Board[] | null => {
    if (isOperatingRef.current) return null;
    isOperatingRef.current = true;

    if (indexRef.current < historyRef.current.length - 1) {
      const result = historyRef.current[indexRef.current + 1];
      indexRef.current += 1;
      forceUpdate(n => n + 1);
      setTimeout(() => { isOperatingRef.current = false; }, 50);
      return result;
    }
    isOperatingRef.current = false;
    return null;
  }, []);

  const canUndo = () => indexRef.current > 0;
  const canRedo = () => indexRef.current < historyRef.current.length - 1;

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