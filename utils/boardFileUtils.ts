import { Board, BoardFile } from '../types';
import { isValidBoard } from './boardUtils';

export const BOARD_FILE_EXTENSION = '.anticloud-board';
export const MAX_BOARD_NAME_LENGTH = 60;

const BOARD_FILE_FORMAT: BoardFile['format'] = 'anticloud-board';
const BOARD_FILE_VERSION: BoardFile['version'] = 1;
const DEFAULT_IMPORTED_NAME = 'Pizarra importada';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const normalizeName = (name: unknown, fallback: string): string => {
  const trimmed = typeof name === 'string' ? name.trim().slice(0, MAX_BOARD_NAME_LENGTH) : '';
  return trimmed || fallback;
};

export const serializeBoard = (board: Board, name: string): string => {
  const file: BoardFile = {
    format: BOARD_FILE_FORMAT,
    version: BOARD_FILE_VERSION,
    name: normalizeName(name, DEFAULT_IMPORTED_NAME),
    savedAt: Date.now(),
    board,
  };
  return JSON.stringify(file);
};

export const parseBoardFile = (text: string): { name: string; board: Board } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  if (isRecord(parsed) && parsed.format !== undefined) {
    if (parsed.format !== BOARD_FILE_FORMAT) {
      throw new Error('El archivo no es una pizarra de AntiCloud.');
    }
    if (parsed.version !== BOARD_FILE_VERSION) {
      throw new Error('El archivo se creó con una versión incompatible de AntiCloud.');
    }
    if (!isValidBoard(parsed.board)) {
      throw new Error('La pizarra del archivo está dañada o incompleta.');
    }
    return { name: normalizeName(parsed.name, DEFAULT_IMPORTED_NAME), board: parsed.board };
  }

  // Tolerate a bare Board JSON (no envelope).
  if (isValidBoard(parsed)) {
    return { name: DEFAULT_IMPORTED_NAME, board: parsed };
  }

  if (isRecord(parsed) && Array.isArray(parsed.boards)) {
    throw new Error('Este archivo es un disquete completo (.anticloud). Cárgalo desde Exportar > Cargar de Disquete.');
  }
  throw new Error('El archivo no es una pizarra de AntiCloud.');
};

const toSafeFileName = (name: string): string => {
  const cleaned = name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '')
    .slice(0, 80);
  const base = cleaned || 'pizarra';
  // Windows reserves these device names, with or without an extension.
  return /^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i.test(base) ? `_${base}` : base;
};

export const downloadTextFile = (text: string, fileName: string): void => {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Deferred so large files are not cut off by an early revoke.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export const downloadBoardFile = (board: Board, name: string): void =>
  downloadTextFile(serializeBoard(board, name), `${toSafeFileName(name)}${BOARD_FILE_EXTENSION}`);
