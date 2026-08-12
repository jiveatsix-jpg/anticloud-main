import { Board, ItemType, BoardItem, TitleImageCollections, TextboxImageCollections, PixelImageCollections, SpriteImageCollections, TitleCollectionKey, TextboxCollectionKey } from '../types';
import { DEFAULT_BACKGROUND, ASSET_SLOTS, DEFAULT_TITLE_IMAGE_URLS, DEFAULT_TEXTBOX_IMAGE_URLS, DEFAULT_BOARD_WIDTH, DEFAULT_BOARD_HEIGHT } from '../constants';
import { generateImageVariants, urlToBase64 } from '../components/imageProcessor';
import { storage } from './storageUtils';

export const padArray = (arr: (string | null)[], length: number): (string | null)[] => {
  const newArr: (string | null)[] = [...(arr || [])];
  while (newArr.length < length) {
    newArr.push(null);
  }
  return newArr.slice(0, length);
};

export const createNewBoard = (): Board => ({
  id: `board_${Date.now()}_${Math.random()}`,
  items: [],
  backgroundUrl: DEFAULT_BACKGROUND,
  width: DEFAULT_BOARD_WIDTH,
  height: DEFAULT_BOARD_HEIGHT,
  backgroundMode: 'expand',
});

export const isValidBoard = (board: unknown): board is Board => {
  if (!board || typeof board !== 'object') return false;
  const b = board as Partial<Board>;
  return typeof b.id === 'string' && typeof b.backgroundUrl === 'string' && Array.isArray(b.items);
};

export const initializeTitleImageCollections = async (): Promise<TitleImageCollections> => {
  const storageKey = 'pixelBoard_titleImages_collections';
  let savedCollections: Partial<TitleImageCollections> = {};
  
  try {
    const saved = await storage.getItem(storageKey);
    if (saved) {
      savedCollections = JSON.parse(saved);
    }
  } catch (error) {
    console.error(`Failed to load or parse title collections from localStorage`, error);
  }

  const collections: Partial<TitleImageCollections> = {};
  const keys: TitleCollectionKey[] = ['x1/2', 'x1', 'x2', 'x3', 'x4'];
  
  for (const key of keys) {
    const firstImg = savedCollections[key]?.[0];
    // Force re-init if it's an old attachment URL or if it's missing
    const isOldUrl = firstImg?.includes('/api/attachments/') || firstImg?.includes('.run.app/api/attachments/');
    
    const collection = savedCollections[key];
    const hasVariants = collection && collection.length > 1 && collection[1] !== null;
    
    if (collection && collection.some(img => img !== null) && !isOldUrl && hasVariants) {
      collections[key] = padArray(collection!, ASSET_SLOTS);
    } else {
      // Initialize from default URL
      const url = DEFAULT_TITLE_IMAGE_URLS[key];
      try {
        const base64 = await urlToBase64(url);
        const variants = await generateImageVariants(base64);
        collections[key] = padArray([base64, ...variants], ASSET_SLOTS);
      } catch (error) {
        console.error(`Failed to generate variants for ${key} from ${url}`, error);
        // If it's a relative path and fetch failed, it might be because of the cache buster or environment
        // Fallback to the raw URL
        collections[key] = padArray([url], ASSET_SLOTS);
      }
    }
  }
  
  const finalCollections = collections as TitleImageCollections;
  await storage.setItem(storageKey, JSON.stringify(finalCollections));
  return finalCollections;
};

export const initializeTextboxImageCollections = async (): Promise<TextboxImageCollections> => {
  const storageKey = 'pixelBoard_textboxImages_collections';
  let savedCollections: Partial<TextboxImageCollections> = {};
  
  try {
    const saved = await storage.getItem(storageKey);
    if (saved) {
      savedCollections = JSON.parse(saved);
    }
  } catch (error) {
    console.error(`Failed to load or parse textbox collections from localStorage`, error);
  }

  const collections: Partial<TextboxImageCollections> = {};
  const keys: TextboxCollectionKey[] = ['x1', 'x4', 'x16'];
  
  for (const key of keys) {
    if (savedCollections[key] && savedCollections[key]?.some(img => img !== null)) {
      collections[key] = padArray(savedCollections[key]!, ASSET_SLOTS);
    } else {
      const url = DEFAULT_TEXTBOX_IMAGE_URLS[key];
      try {
        const base64 = await urlToBase64(url);
        const variants = await generateImageVariants(base64);
        collections[key] = padArray([base64, ...variants], ASSET_SLOTS);
      } catch (error) {
        console.error(`Failed to generate variants for ${key} from ${url}`, error);
        collections[key] = padArray([url], ASSET_SLOTS);
      }
    }
  }
  
  const finalCollections = collections as TextboxImageCollections;
  await storage.setItem(storageKey, JSON.stringify(finalCollections));
  return finalCollections;
};

export const loadPixelImageCollectionsFromStorage = async (key: string): Promise<PixelImageCollections> => {
  const defaultCollections: PixelImageCollections = {
    C1: { id: 'C1', name: 'Categoría 1', images: padArray([], ASSET_SLOTS) },
    C2: { id: 'C2', name: 'Categoría 2', images: padArray([], ASSET_SLOTS) },
    C3: { id: 'C3', name: 'Categoría 3', images: padArray([], ASSET_SLOTS) },
    C4: { id: 'C4', name: 'Categoría 4', images: padArray([], ASSET_SLOTS) },
    C5: { id: 'C5', name: 'Categoría 5', images: padArray([], ASSET_SLOTS) },
    C6: { id: 'C6', name: 'Categoría 6', images: padArray([], ASSET_SLOTS) },
    C7: { id: 'C7', name: 'Categoría 7', images: padArray([], ASSET_SLOTS) },
    C8: { id: 'C8', name: 'Categoría 8', images: padArray([], ASSET_SLOTS) },
  };
  try {
    const saved = await storage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration and validation
      const collections: PixelImageCollections = { ...defaultCollections };
      Object.keys(parsed).forEach(id => {
        const item = parsed[id];
        if (Array.isArray(item)) {
          // Old format: just an array of images
          collections[id] = {
            id,
            name: id.replace('C', 'Categoría '),
            images: padArray(item, ASSET_SLOTS)
          };
        } else if (item && typeof item === 'object' && 'images' in item) {
          // New format
          collections[id] = {
            id: item.id || id,
            name: item.name || id.replace('C', 'Categoría '),
            images: padArray(item.images, ASSET_SLOTS)
          };
        }
      });
      return collections;
    }
  } catch (error) {
    console.error(`Failed to load pixel image collections from localStorage for key: ${key}`, error);
  }
  return defaultCollections;
};

export const loadSpriteImageCollectionsFromStorage = async (key: string): Promise<SpriteImageCollections> => {
  const defaultCollections: SpriteImageCollections = {
    S1: { id: 'S1', name: 'Colección 1', images: padArray([], ASSET_SLOTS) },
    S2: { id: 'S2', name: 'Colección 2', images: padArray([], ASSET_SLOTS) },
    S3: { id: 'S3', name: 'Colección 3', images: padArray([], ASSET_SLOTS) },
    S4: { id: 'S4', name: 'Colección 4', images: padArray([], ASSET_SLOTS) },
    S5: { id: 'S5', name: 'Colección 5', images: padArray([], ASSET_SLOTS) },
    S6: { id: 'S6', name: 'Colección 6', images: padArray([], ASSET_SLOTS) },
    S7: { id: 'S7', name: 'Colección 7', images: padArray([], ASSET_SLOTS) },
    S8: { id: 'S8', name: 'Colección 8', images: padArray([], ASSET_SLOTS) },
  };
  try {
    const saved = await storage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration and validation
      const collections: SpriteImageCollections = { ...defaultCollections };
      Object.keys(parsed).forEach(id => {
        const item = parsed[id];
        if (Array.isArray(item)) {
          // Old format
          collections[id] = {
            id,
            name: id.replace('S', 'Colección '),
            images: padArray(item, ASSET_SLOTS)
          };
        } else if (item && typeof item === 'object' && 'images' in item) {
          // New format
          collections[id] = {
            id: item.id || id,
            name: item.name || id.replace('S', 'Colección '),
            images: padArray(item.images, ASSET_SLOTS)
          };
        }
      });
      return collections;
    }
  } catch (error) {
    console.error(`Failed to load sprite image collections from localStorage for key: ${key}`, error);
  }
  return defaultCollections;
};
