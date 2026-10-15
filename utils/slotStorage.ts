import { createStore, delMany, get, getMany, keys, setMany, type UseStore } from 'idb-keyval';
import { Board, RecoveryBackupMeta, SaveSlotMeta } from '../types';
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

// Recovery backups mirror the slot layout: the raw text under `recovery:<suffix>` and a tiny
// `recovery-meta:<suffix>` twin, so listing never loads the (possibly tens of MB) raw strings.
// The `recovery-meta:` prefix deliberately does not match the `meta:` filter used by listSlots.
const RECOVERY_PREFIX = 'recovery:';
const RECOVERY_META_PREFIX = 'recovery-meta:';

const isValidRecoveryMeta = (value: unknown): value is RecoveryBackupMeta => {
  if (!value || typeof value !== 'object') return false;
  const m = value as Partial<RecoveryBackupMeta>;
  return typeof m.key === 'string' && typeof m.savedAt === 'number' && typeof m.bytes === 'number';
};

// Keeps the raw bytes of a stored value the app could not fully read, so replacing it with defaults
// never destroys user data. The key is derived from the content, so backing up the same value twice is a no-op.
export const saveRecoveryBackup = async (raw: string): Promise<void> => {
  let hash = 0;
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  const suffix = `${raw.length}:${(hash >>> 0).toString(36)}`;
  // `bytes` is the string length: close enough for display, since the content is mostly ASCII data URLs.
  const meta: RecoveryBackupMeta = { key: `${RECOVERY_PREFIX}${suffix}`, savedAt: Date.now(), bytes: raw.length };
  try {
    await setMany(
      [[meta.key, { savedAt: meta.savedAt, raw }], [`${RECOVERY_META_PREFIX}${suffix}`, meta]],
      getSlotStore(),
    );
  } catch (e) {
    throw storageError('No se pudo respaldar el contenido ilegible de las pizarras.', e);
  }
};

export const listRecoveryBackups = async (): Promise<RecoveryBackupMeta[]> => {
  try {
    const store = getSlotStore();
    const metaKeys = (await keys<string>(store)).filter(k => typeof k === 'string' && k.startsWith(RECOVERY_META_PREFIX));
    const metas = await getMany<unknown>(metaKeys, store);
    return metas.filter(isValidRecoveryMeta).sort((a, b) => b.savedAt - a.savedAt);
  } catch (e) {
    throw storageError('No se pudo leer la lista de respaldos de recuperación.', e);
  }
};

export const loadRecoveryBackup = async (key: string): Promise<string | null> => {
  if (!key.startsWith(RECOVERY_PREFIX)) return null;
  try {
    const stored = await get<{ raw?: unknown }>(key, getSlotStore());
    return typeof stored?.raw === 'string' ? stored.raw : null;
  } catch (e) {
    throw storageError('No se pudo leer el respaldo de recuperación.', e);
  }
};

export const deleteRecoveryBackup = async (key: string): Promise<void> => {
  if (!key.startsWith(RECOVERY_PREFIX)) return;
  try {
    await delMany([key, `${RECOVERY_META_PREFIX}${key.slice(RECOVERY_PREFIX.length)}`], getSlotStore());
  } catch (e) {
    throw storageError('No se pudo borrar el respaldo de recuperación.', e);
  }
};

export const deleteSlot = async (id: string): Promise<void> => {
  try {
    await delMany([slotKey(id), metaKey(id)], getSlotStore());
  } catch (e) {
    throw storageError('No se pudo borrar el guardado.', e);
  }
};
