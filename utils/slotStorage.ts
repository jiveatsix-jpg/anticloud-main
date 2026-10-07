import { createStore, delMany, get, getMany, keys, setMany, type UseStore } from 'idb-keyval';
import { Board, SaveSlotMeta } from '../types';
import { isValidBoard } from './boardUtils';
import { MAX_BOARD_NAME_LENGTH } from './boardFileUtils';

// Separate IndexedDB database on purpose: storage.clearAll() (F10) only wipes the default
// idb-keyval store, so save slots survive it. Never clear this store from other code.
// Created lazily so a missing IndexedDB cannot break app startup.
let slotStore: UseStore | undefined;
const getSlotStore = (): UseStore => (slotStore ??= createStore('anticloud-slots', 'slots'));

// Each slot lives under its own key. A tiny `meta:` twin is written in the same transaction so
// listing never has to deserialize whole boards (which embed images as data URLs).
const slotKey = (id: string) => `slot:${id}`;
const metaKey = (id: string) => `meta:${id}`;

interface StoredSlot {
  meta: SaveSlotMeta;
  board: Board;
}

const isValidMeta = (value: unknown): value is SaveSlotMeta => {
  if (!value || typeof value !== 'object') return false;
  const m = value as Partial<SaveSlotMeta>;
  return typeof m.id === 'string' && typeof m.name === 'string'
    && typeof m.savedAt === 'number' && typeof m.itemCount === 'number';
};

const storageError = (message: string, cause: unknown): Error => {
  console.error(`ANTI_CLOUD ${message}`, cause);
  return new Error(message);
};

export const listSlots = async (): Promise<SaveSlotMeta[]> => {
  try {
    const store = getSlotStore();
    const metaKeys = (await keys<string>(store)).filter(k => typeof k === 'string' && k.startsWith('meta:'));
    const metas = await getMany<unknown>(metaKeys, store);
    return metas.filter(isValidMeta).sort((a, b) => b.savedAt - a.savedAt);
  } catch (e) {
    throw storageError('No se pudo leer la lista de guardados.', e);
  }
};

export const saveSlot = async (name: string, board: Board, existingId?: string): Promise<SaveSlotMeta> => {
  const meta: SaveSlotMeta = {
    id: existingId ?? `slot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim().slice(0, MAX_BOARD_NAME_LENGTH) || 'Pizarra',
    savedAt: Date.now(),
    itemCount: board.items.length,
  };
  try {
    const stored: StoredSlot = { meta, board };
    await setMany([[slotKey(meta.id), stored], [metaKey(meta.id), meta]], getSlotStore());
    return meta;
  } catch (e) {
    throw storageError('No se pudo guardar la pizarra. Puede que no quede espacio de almacenamiento.', e);
  }
};

export const loadSlot = async (id: string): Promise<Board | null> => {
  try {
    const stored = await get<Partial<StoredSlot>>(slotKey(id), getSlotStore());
    if (!stored) return null;
    if (!isValidBoard(stored.board)) throw new Error('Invalid board stored in slot');
    return stored.board;
  } catch (e) {
    throw storageError('No se pudo cargar el guardado.', e);
  }
};

export const deleteSlot = async (id: string): Promise<void> => {
  try {
    await delMany([slotKey(id), metaKey(id)], getSlotStore());
  } catch (e) {
    throw storageError('No se pudo borrar el guardado.', e);
  }
};
