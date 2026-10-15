// Default background is black (no image).
export const DEFAULT_BACKGROUND = '';

// Default images for title element collections.
export const DEFAULT_TITLE_IMAGE_URLS: { [key in 'x1/2' | 'x1' | 'x2' | 'x3' | 'x4']: string } = {
    'x1/2': 'https://i.imgur.com/ME0kC4m.png',
    x1: 'https://i.imgur.com/DFIsoDP.png',
    x2: 'https://i.imgur.com/8mdKJXY.png',
    x3: 'https://i.imgur.com/skzPVzV.png',
    x4: 'https://i.imgur.com/KO9etx2.png',
};

// Default images for textbox element collections.
export const DEFAULT_TEXTBOX_IMAGE_URLS: { [key in 'x1' | 'x4' | 'x16']: string } = {
    x1: 'https://i.imgur.com/nWTw0o4.png',
    x4: 'https://i.imgur.com/9OJR3wu.png',
    x16: 'https://i.imgur.com/FEWqBOx.png',
};

export const ASSET_SLOTS = 18;

// Sprite base y valores de 9-slice para el tipo Caja.
export const DEFAULT_BOX_IMAGE_URL = '/assets/sprites/box.png';
export const DEFAULT_BOX_BORDER_SLICE = { top: 18, right: 31, bottom: 24, left: 28 };

// Marco redimensionable (borde 9-slice con centro transparente).
export const DEFAULT_FRAME_IMAGE_URL = '/assets/sprites/frame.png';
export const DEFAULT_FRAME_BORDER_SLICE = { top: 16, right: 16, bottom: 16, left: 16 };

export interface FrameStyle {
  id: string;
  label: string;
  url: string;
}

export const FRAME_STYLES: FrameStyle[] = [
  { id: 'wood', label: 'Madera', url: '/assets/sprites/frame-wood.png' },
  { id: 'gold', label: 'Oro', url: '/assets/sprites/frame-gold.png' },
  { id: 'silver', label: 'Plata', url: '/assets/sprites/frame-silver.png' },
  { id: 'iron', label: 'Hierro', url: '/assets/sprites/frame-iron.png' },
  { id: 'crimson', label: 'Crimson', url: '/assets/sprites/frame-crimson.png' },
  { id: 'ocean', label: 'Océano', url: '/assets/sprites/frame-ocean.png' },
  { id: 'forest', label: 'Bosque', url: '/assets/sprites/frame-forest.png' },
  { id: 'violet', label: 'Violeta', url: '/assets/sprites/frame-violet.png' },
  { id: 'obsidian', label: 'Obsidiana', url: '/assets/sprites/frame-obsidian.png' },
  { id: 'ice', label: 'Hielo', url: '/assets/sprites/frame-ice.png' },
];

// Available font faces for text items.
export const FONT_FACES = [
  "'VT323', monospace",
  "'Press Start 2P', cursive",
  "'Silkscreen', sans-serif",
  "'Pixelify Sans', sans-serif",
  "'DotGothic16', sans-serif",
  "'Tiny5', sans-serif",
  "'Sixtyfour', sans-serif",
  "'Micro 5', sans-serif",
  "'Bungee', sans-serif",
  "'Bungee Outline', sans-serif",
  "'Monofett', monospace",
  "'Creepster', cursive",
  "'Plaster', display",
  "'Rye', serif",
];

export const GRID_SIZE = 20;
export const DEFAULT_BOARD_WIDTH = 3000;
export const DEFAULT_BOARD_HEIGHT = 2000;
export const BOARD_MIN_SIZE = 50;
export const BOARD_MAX_SIZE = 10000;

export interface BoardSizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const BOARD_SIZE_PRESETS: BoardSizePreset[] = [
  { id: 'standard', label: 'Estándar', width: DEFAULT_BOARD_WIDTH, height: DEFAULT_BOARD_HEIGHT },
  { id: 'small', label: 'Pequeña', width: 1500, height: 1000 },
  { id: 'large', label: 'Grande', width: 5000, height: 3500 },
  { id: 'square', label: 'Cuadrada', width: 2500, height: 2500 },
  { id: 'panoramic', label: 'Panorámica', width: 4000, height: 1500 },
  { id: 'vertical', label: 'Vertical', width: 2000, height: 3000 },
  { id: 'full-hd', label: 'Pantalla Full HD', width: 1920, height: 1080 },
  { id: 'medium', label: 'Mediana', width: 1000, height: 700 },
  { id: 'compact', label: 'Compacta', width: 800, height: 600 },
  { id: 'small-square', label: 'Cuadrada pequeña', width: 800, height: 800 },
  { id: 'small-vertical', label: 'Vertical pequeña', width: 600, height: 900 },
  { id: 'mini', label: 'Mini', width: 400, height: 300 },
];

export interface Theme {
  name: string;
  colors: {
    '--pixel-border-color': string;
    '--pixel-bg-color': string;
    '--pixel-content-bg-color': string;
    '--pixel-highlight-color': string;
  };
}

export const THEMES: Theme[] = [
  {
    name: 'Ocean',
    colors: {
      '--pixel-border-color': '#0d2b45',
      '--pixel-bg-color': '#203c56',
      '--pixel-content-bg-color': 'rgba(0, 0, 0, 0.4)',
      '--pixel-highlight-color': '#fca311',
    },
  },
  {
    name: 'Forest',
    colors: {
      '--pixel-border-color': '#2d251d',
      '--pixel-bg-color': '#4a4238',
      '--pixel-content-bg-color': 'rgba(29, 21, 14, 0.6)',
      '--pixel-highlight-color': '#94e044',
    },
  },
  {
    name: 'Volcano',
    colors: {
      '--pixel-border-color': '#281815',
      '--pixel-bg-color': '#4a221c',
      '--pixel-content-bg-color': 'rgba(0, 0, 0, 0.6)',
      '--pixel-highlight-color': '#ff783a',
    },
  },
  {
    name: 'Royal',
    colors: {
      '--pixel-border-color': '#291f3c',
      '--pixel-bg-color': '#483869',
      '--pixel-content-bg-color': 'rgba(25, 17, 38, 0.6)',
      '--pixel-highlight-color': '#ffd659',
    },
  },
  {
    name: 'Monochrome',
    colors: {
      '--pixel-border-color': '#000000',
      '--pixel-bg-color': '#444444',
      '--pixel-content-bg-color': 'rgba(0, 0, 0, 0.5)',
      '--pixel-highlight-color': '#ffffff',
    },
  },
  {
    name: 'Punk Rock',
    colors: {
      '--pixel-border-color': '#000000',
      '--pixel-bg-color': '#440c15',
      '--pixel-content-bg-color': 'rgba(0, 0, 0, 0.6)',
      '--pixel-highlight-color': '#ff33a8',
    },
  },
  {
    name: 'Vaporwave',
    colors: {
      '--pixel-border-color': '#ff71ce',
      '--pixel-bg-color': '#01cdfe',
      '--pixel-content-bg-color': 'rgba(181, 126, 220, 0.4)',
      '--pixel-highlight-color': '#fffb96',
    },
  },
  {
    name: 'Cyber Neon',
    colors: {
      '--pixel-border-color': '#00ff9f',
      '--pixel-bg-color': '#001845',
      '--pixel-content-bg-color': 'rgba(0, 0, 0, 0.8)',
      '--pixel-highlight-color': '#ff0055',
    },
  },
];

// Texturas de fondo de pizarra: patrones CSS generados (sin archivos de imagen),
// pensados como overlay liviano sobre el color/imagen de fondo, no como reemplazo.
export const BOARD_TEXTURES: { id: string; label: string; backgroundImage: string; backgroundSize: string }[] = [
  { id: 'none', label: 'Ninguna', backgroundImage: 'none', backgroundSize: 'auto' },
  {
    id: 'dots',
    label: 'Puntos',
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px)',
    backgroundSize: '14px 14px',
  },
  {
    id: 'grid',
    label: 'Cuadrícula',
    backgroundImage:
      'repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0 1px, transparent 1px 22px), ' +
      'repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0 1px, transparent 1px 22px)',
    backgroundSize: '22px 22px',
  },
  {
    id: 'diagonal',
    label: 'Diagonal',
    backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 6px, transparent 6px 18px)',
    backgroundSize: 'auto',
  },
  {
    id: 'scanlines',
    label: 'Líneas',
    backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0 1px, transparent 1px 5px)',
    backgroundSize: 'auto',
  },
];
