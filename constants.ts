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
