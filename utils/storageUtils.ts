import { get, set, del, clear } from 'idb-keyval';

// Writes to the same key are fire-and-forget from callers, so without
// serialization two concurrent setItem calls for the same key could resolve
// out of order and leave a stale value persisted. Chain them per key instead.
const pendingWrites = new Map<string, Promise<void>>();

// `failed` tells "nothing stored" apart from "could not read IndexedDB": callers that would overwrite
// the key with defaults need to know the difference. The localStorage fallback value is still returned.
const tryGetItem = async (key: string): Promise<{ value: string | null; failed: boolean }> => {
  let value: string | undefined;
  try {
    value = await get<string>(key);
  } catch (e) {
    console.error(`ANTI_CLOUD Error leyendo ${key}:`, e);
    return { value: localStorage.getItem(key), failed: true };
  }
  if (value !== undefined && value !== null) {
    return { value, failed: false };
  }
  // Fallback a localStorage para migrar datos antiguos de manera transparente
  const localValue = localStorage.getItem(key);
  if (localValue === null) {
    return { value: null, failed: false };
  }
  try {
    await set(key, localValue);
  } catch (e) {
    console.error(`ANTI_CLOUD Error migrando ${key} a IndexedDB:`, e);
  }
  return { value: localValue, failed: false };
};

export const storage = {
  tryGetItem,
  async clearAll(): Promise<void> {
    try {
      await clear();
      localStorage.clear();
      console.log('ANTI_CLOUD: Datos eliminados por completo.');
    } catch (e) {
      console.error('ANTI_CLOUD Error al limpiar datos:', e);
    }
  },
  async getItem(key: string): Promise<string | null> {
    return (await tryGetItem(key)).value;
  },

  async setItem(key: string, value: string): Promise<void> {
    const previous = pendingWrites.get(key) || Promise.resolve();
    const write = previous.then(async () => {
      try {
        await set(key, value);
        // Borrar la copia de localStorage si existe para ahorrar espacio
        localStorage.removeItem(key);
      } catch (e) {
        console.error(`ANTI_CLOUD Error guardando ${key} en IndexedDB:`, e);
        // Fallback estricto a localStorage si IndexedDB falla
        try {
          localStorage.setItem(key, value);
        } catch (err) {
          console.error("ANTI_CLOUD Alerta Crítica: LocalStorage quota exceeded.", err);
        }
      }
    });
    pendingWrites.set(key, write);
    await write;
    if (pendingWrites.get(key) === write) pendingWrites.delete(key);
  },

  async removeItem(key: string): Promise<void> {
    try {
      await del(key);
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`ANTI_CLOUD Error eliminando ${key}:`, e);
    }
  }
};
