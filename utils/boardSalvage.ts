import { Board, BoardItem, Connection } from '../types';
import { DEFAULT_BACKGROUND, DEFAULT_BOARD_HEIGHT, DEFAULT_BOARD_WIDTH } from '../constants';
import { clampBoardSize, generateBoardId, isValidBoard } from './boardUtils';

// Candidates deeper than this are skipped: the stored shape is boards > items > item, a few levels at most.
const MAX_CUT_DEPTH = 6;
// Bounds memory on pathological input (a cut costs two numbers); later cut points are simply not recorded.
const MAX_CUT_POINTS = 500_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

interface CutPoints {
  cuts: number[];
  closerIds: number[];
  closerTable: string[];
}

// Single forward pass over the text. A cut point is just after a `}`/`]` or just before a `,` outside
// strings, i.e. a place where everything before it is a complete value. Each one is stored as an index
// plus the closers that would complete the containers still open there.
const findCutPoints = (raw: string): CutPoints => {
  const points: CutPoints = { cuts: [], closerIds: [], closerTable: [] };
  const closerIndex = new Map<string, number>();
  let closers = '';
  let inString = false;
  let escaped = false;

  const record = (cut: number) => {
    const { cuts, closerIds, closerTable } = points;
    if (cuts.length >= MAX_CUT_POINTS || closers.length > MAX_CUT_DEPTH || cuts[cuts.length - 1] === cut) return;
    let id = closerIndex.get(closers);
    if (id === undefined) {
      id = closerTable.length;
      closerTable.push(closers);
      closerIndex.set(closers, id);
    }
    cuts.push(cut);
    closerIds.push(id);
  };

  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    if (inString) {
      if (escaped) escaped = false;
      else if (c === 92) escaped = true;
      else if (c === 34) inString = false;
      continue;
    }
    if (c === 34) {
      inString = true;
    } else if (c === 123) {
      closers = `}${closers}`;
    } else if (c === 91) {
      closers = `]${closers}`;
    } else if (c === 125 || c === 93) {
      // A stray or mismatched closer means the rest is garbage; keep what was recorded so far.
      if (closers[0] !== (c === 125 ? '}' : ']')) break;
      closers = closers.slice(1);
      record(i + 1);
    } else if (c === 44) {
      record(i);
    }
  }
  return points;
};

// Repairs truncated/corrupt JSON by cutting it at the last point where it still parses once the open
// containers are closed. Success is monotonic in the cut position (a prefix is valid up to the damage,
// invalid after it), so after trying the last cut (plain truncation) a binary search finds the longest
// valid prefix in a handful of parses instead of one per candidate.
const repairJson = (raw: string): unknown => {
  const { cuts, closerIds, closerTable } = findCutPoints(raw);
  const tryCut = (k: number): unknown => {
    try {
      return JSON.parse(raw.slice(0, cuts[k]) + closerTable[closerIds[k]]);
    } catch {
      return undefined;
    }
  };

  const last = cuts.length - 1;
  if (last < 0) return undefined;
  const whole = tryCut(last);
  if (whole !== undefined) return whole;

  let found: unknown;
  let lo = 0;
  let hi = last - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const parsed = tryCut(mid);
    if (parsed !== undefined) {
      found = parsed;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
};

const parseOrRepair = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return repairJson(raw);
  }
};

const candidateBoards = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value.boards)) return value.boards;
  if (isRecord(value) && Array.isArray(value.items)) return [value];
  return [];
};

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

// Keeps only items that can be placed on a board; a cut-off last item typically fails this check.
const normalizeItem = (value: unknown): BoardItem | null => {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.type !== 'string') return null;
  if (!isFiniteNumber(value.x) || !isFiniteNumber(value.y) || !isFiniteNumber(value.width) || !isFiniteNumber(value.height)) return null;
  return {
    ...value,
    imageUrl: typeof value.imageUrl === 'string' ? value.imageUrl : '',
    text: typeof value.text === 'string' ? value.text : '',
  } as unknown as BoardItem;
};

const normalizeConnections = (value: unknown, itemIds: Set<string>): Connection[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value.filter((c): c is Connection =>
    isRecord(c) && typeof c.id === 'string'
    && typeof c.fromId === 'string' && itemIds.has(c.fromId)
    && typeof c.toId === 'string' && itemIds.has(c.toId));
};

const normalizeBoard = (value: unknown, usedIds: Set<string>): Board | null => {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;

  let id = typeof value.id === 'string' && value.id !== '' ? value.id : '';
  while (!id || usedIds.has(id)) id = generateBoardId();
  usedIds.add(id);

  const items = value.items.map(normalizeItem).filter((item): item is BoardItem => item !== null);
  const connections = normalizeConnections(value.connections, new Set(items.map(item => item.id)));

  const board: Board = {
    ...(value as Partial<Board>),
    id,
    items,
    connections,
    backgroundUrl: typeof value.backgroundUrl === 'string' ? value.backgroundUrl : DEFAULT_BACKGROUND,
    width: clampBoardSize(isFiniteNumber(value.width) ? value.width : NaN, DEFAULT_BOARD_WIDTH),
    height: clampBoardSize(isFiniteNumber(value.height) ? value.height : NaN, DEFAULT_BOARD_HEIGHT),
  };
  if (!connections) delete board.connections;
  return isValidBoard(board) ? board : null;
};

// Best-effort extraction of boards from raw stored text that may be truncated or partly corrupt.
// Never throws; returns [] when nothing is salvageable.
export const salvageBoards = (raw: string): Board[] => {
  try {
    const usedIds = new Set<string>();
    return candidateBoards(parseOrRepair(raw))
      .map(candidate => normalizeBoard(candidate, usedIds))
      .filter((board): board is Board => board !== null);
  } catch (e) {
    console.error('ANTI_CLOUD: Fallo al recuperar pizarras de un respaldo', e);
    return [];
  }
};
