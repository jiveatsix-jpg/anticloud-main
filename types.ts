export enum ItemType {
  Title = 'TITLE',
  Textbox = 'TEXTBOX',
  Pixel = 'PIXEL',
  Sprite = 'SPRITE',
  Music = 'MUSIC',
  Counter = 'COUNTER',
  Timer = 'TIMER',
  File = 'FILE',
  Checkbox = 'CHECKBOX',
  PlainText = 'PLAIN_TEXT',
  Box = 'BOX',
  Frame = 'FRAME',
}

export interface TextFragment {
  text: string;
  color?: string;
  shadowColor?: string;
  hasShadow?: boolean;
}

export interface BoardItem {
  id: string;
  type: ItemType;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  notes?: string;
  textFragments?: TextFragment[];
  textColor?: string;
  fontFamily?: string;
  textShadow?: boolean;
  textShadowColor?: string;
  fontSize?: number;
  textOffsetX?: number;
  textOffsetY?: number;
  textAlign?: 'left' | 'center' | 'right';
  textTransform?: 'none' | 'uppercase';
  secondaryImageUrl?: string;
  blinkInterval?: number;
  counterValue?: number;
  neonGlow?: boolean;
  neonColor?: string;
  timerMode?: 'chrono' | 'timer';
  timerValue?: number; // in seconds
  timerInitialValue?: number; // in seconds
  isTimerRunning?: boolean;
  fileName?: string;
  fileContent?: string;
  floating?: boolean;
  glitch?: boolean;
  rainbow?: boolean;
  scanlines?: boolean;
  terminalScan?: boolean;
  shake?: boolean;
  pulse?: boolean;
  blur?: boolean;
  staticNoise?: boolean;
  typewriter?: boolean;
  breathing?: boolean;
  checked?: boolean;
  groupId?: string;
  collapsed?: boolean;
  borderSlice?: { top: number; right: number; bottom: number; left: number };
  boxFilter?: string;
  secondaryBoxFilter?: string;
  animationHueFilters?: string[];
  editingFragmentIndex?: number;
}

export type ConnectionSide = 'top' | 'right' | 'bottom' | 'left';

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  color?: string;
  // Locked in at creation time so the anchor point stays put as items move;
  // absent on connections created before this field existed, which keep
  // re-anchoring dynamically until deleted and recreated.
  fromSide?: ConnectionSide;
  toSide?: ConnectionSide;
}

export interface Board {
  id: string;
  items: BoardItem[];
  connections?: Connection[];
  backgroundUrl: string;
  width?: number;
  height?: number;
  backgroundMode?: 'tile' | 'expand' | 'center';
  backgroundColor?: string;
  backgroundTexture?: string;
  screenFilter?: 'none' | 'crt' | 'sepia' | 'grayscale' | 'gameboy' | 'glitch';
  particles?: 'none' | 'rain' | 'confetti';
}

export type TextboxCollectionKey = 'x1' | 'x4' | 'x16';

export interface TextboxImageCollections {
  x1: (string | null)[];
  x4: (string | null)[];
  x16: (string | null)[];
}

export type TitleCollectionKey = 'x1/2' | 'x1' | 'x2' | 'x3' | 'x4';

export interface TitleImageCollections {
  'x1/2': (string | null)[];
  x1: (string | null)[];
  x2: (string | null)[];
  x3: (string | null)[];
  x4: (string | null)[];
}

export interface AssetCategory {
  id: string;
  name: string;
  images: (string | null)[];
}

export interface PixelImageCollections {
  [id: string]: AssetCategory;
}

export interface SpriteImageCollections {
  [id: string]: AssetCategory;
}
