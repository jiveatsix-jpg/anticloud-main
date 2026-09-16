import { Board, BoardItem, ItemType, ConnectionSide } from '../types';
import { FONT_FACES, DEFAULT_BOX_BORDER_SLICE, DEFAULT_FRAME_BORDER_SLICE } from '../constants';

interface BorderSlice { top: number; right: number; bottom: number; left: number; }

/**
 * Mirrors DraggableItem.tsx's CSS `border-image: url(...) T R B L [fill] stretch`
 * rendering (9-slice: corners drawn 1:1, edges stretched along one axis, center
 * stretched both axes only when `fill` is set) — a plain `drawImage(img, x, y, w, h)`
 * stretches the WHOLE sprite including the corners, which is what made resized
 * Box/Frame items come out visibly warped in exported captures despite looking
 * correct on screen.
 */
const drawNineSlice = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slice: BorderSlice,
  dx: number, dy: number, dw: number, dh: number,
  fillCenter: boolean
) => {
  const sw = img.naturalWidth || img.width;
  const sh = img.naturalHeight || img.height;
  const { top: t, right: r, bottom: b, left: l } = slice;
  const srcCenterW = Math.max(0, sw - l - r);
  const srcCenterH = Math.max(0, sh - t - b);
  const dstCenterW = Math.max(0, dw - l - r);
  const dstCenterH = Math.max(0, dh - t - b);

  const draw = (sx: number, sy: number, sWidth: number, sHeight: number, ddx: number, ddy: number, dWidth: number, dHeight: number) => {
    if (sWidth <= 0 || sHeight <= 0 || dWidth <= 0 || dHeight <= 0) return;
    ctx.drawImage(img, sx, sy, sWidth, sHeight, ddx, ddy, dWidth, dHeight);
  };

  // 4 corners — drawn at native size, never stretched.
  draw(0, 0, l, t, dx, dy, l, t);
  draw(sw - r, 0, r, t, dx + dw - r, dy, r, t);
  draw(0, sh - b, l, b, dx, dy + dh - b, l, b);
  draw(sw - r, sh - b, r, b, dx + dw - r, dy + dh - b, r, b);
  // 4 edges — stretched along one axis only.
  draw(l, 0, srcCenterW, t, dx + l, dy, dstCenterW, t);
  draw(l, sh - b, srcCenterW, b, dx + l, dy + dh - b, dstCenterW, b);
  draw(0, t, l, srcCenterH, dx, dy + t, l, dstCenterH);
  draw(sw - r, t, r, srcCenterH, dx + dw - r, dy + t, r, dstCenterH);
  // center — only for Box items ("fill"); Frame items leave it transparent.
  if (fillCenter) {
    draw(l, t, srcCenterW, srcCenterH, dx + l, dy + t, dstCenterW, dstCenterH);
  }
};

interface ConnectableRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Which side (top/bottom/left/right) of `from` faces `to`, compared against
 * `from`'s own aspect ratio (not a raw 45° split) so a wide box favors
 * exiting left/right over top/bottom, and vice versa.
 */
export const getConnectionSide = (from: ConnectableRect, to: ConnectableRect): ConnectionSide => {
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;
  const halfWidth = from.width / 2;
  const halfHeight = from.height / 2;
  if (Math.abs(dx) * halfHeight > Math.abs(dy) * halfWidth) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'bottom' : 'top';
};

/**
 * Where a connection line should touch `from`'s box: the midpoint of whichever
 * side (top/bottom/left/right) faces `to`, instead of `from`'s raw center —
 * so a link coming from roughly the side sits flush on that side instead of
 * cutting across the box diagonally. Recomputed every render, so the anchor
 * slides as the boxes move; use `getPointForSide` for a side locked in at
 * connection-creation time.
 */
export const getEdgeConnectionPoint = (from: ConnectableRect, to: ConnectableRect): { x: number; y: number } => {
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;
  if (fromCenterX === toCenterX && fromCenterY === toCenterY) {
    return { x: fromCenterX, y: fromCenterY };
  }
  return getPointForSide(from, getConnectionSide(from, to));
};

/** The midpoint of a specific, already-decided side — independent of where the other item sits. */
export const getPointForSide = (rect: ConnectableRect, side: ConnectionSide): { x: number; y: number } => {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;
  switch (side) {
    case 'left': return { x: centerX - halfWidth, y: centerY };
    case 'right': return { x: centerX + halfWidth, y: centerY };
    case 'top': return { x: centerX, y: centerY - halfHeight };
    case 'bottom': return { x: centerX, y: centerY + halfHeight };
  }
};

export const wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  if (words.length === 0) return [];
  
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = context.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

export const captureBoardToCanvas = async (activeBoard: Board, captureArea?: { x: number; y: number; width: number; height: number; }): Promise<HTMLCanvasElement> => {
  const boardWidth = captureArea ? captureArea.width : (activeBoard.width || 3000);
  const boardHeight = captureArea ? captureArea.height : (activeBoard.height || 2000);

  const canvas = document.createElement('canvas');
  canvas.width = boardWidth;
  canvas.height = boardHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  
  if (captureArea) {
    ctx.translate(-captureArea.x, -captureArea.y);
  }

  // Solid background color sits below the image, same as the CSS layering
  // used on the live board (BoardCanvas.tsx) — fill it first either way.
  ctx.fillStyle = activeBoard.backgroundColor || '#000000';
  if (captureArea) {
    ctx.fillRect(captureArea.x, captureArea.y, captureArea.width, captureArea.height);
  } else {
    ctx.fillRect(0, 0, boardWidth, boardHeight);
  }

  if (activeBoard.backgroundUrl) {
    const bgImg = new Image();
    bgImg.crossOrigin = 'Anonymous';
    await new Promise((resolve, reject) => {
      bgImg.onload = resolve;
      bgImg.onerror = reject;
      bgImg.src = activeBoard.backgroundUrl;
    });
    const pattern = ctx.createPattern(bgImg, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      if (captureArea) {
        ctx.fillRect(captureArea.x, captureArea.y, captureArea.width, captureArea.height);
      } else {
        ctx.fillRect(0, 0, boardWidth, boardHeight);
      }
    }
  }

  const imageLoadPromises = activeBoard.items.map(item =>
    new Promise<{ item: BoardItem, img: HTMLImageElement | null }>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve({ item, img });
      img.onerror = () => {
        console.warn(`Could not load image for item ${item.id}: ${item.imageUrl}`);
        resolve({item, img: null});
      };
      img.src = item.imageUrl;
    })
  );

  const loadedItems = await Promise.all(imageLoadPromises);
  
  for (const { item, img } of loadedItems) {
    if (!img) continue;

    if (item.type === ItemType.Box) {
      drawNineSlice(ctx, img, item.borderSlice || DEFAULT_BOX_BORDER_SLICE, item.x, item.y, item.width, item.height, true);
    } else if (item.type === ItemType.Frame) {
      drawNineSlice(ctx, img, item.borderSlice || DEFAULT_FRAME_BORDER_SLICE, item.x, item.y, item.width, item.height, false);
    } else {
      ctx.drawImage(img, item.x, item.y, item.width, item.height);
    }

    if (item.text) {
      const fontSize = item.fontSize || 24;
      const lineHeight = fontSize * 1.2;
      const PADDING = 16;
      const fontName = (item.fontFamily || FONT_FACES[0]).split(',')[0].replace(/'/g, '');
      ctx.font = `${fontSize}px "${fontName}"`;
      ctx.textBaseline = 'top';
      
      const textOffsetX = item.textOffsetX || 0;
      const textOffsetY = item.textOffsetY || 0;

      const textLines = wrapText(ctx, item.text, item.width - PADDING * 2);
      const totalTextHeight = textLines.length * lineHeight - (lineHeight - fontSize);
      const textBlockY = item.y + (item.height - totalTextHeight) / 2 + textOffsetY;

      for (let i = 0; i < textLines.length; i++) {
        const line = textLines[i];
        ctx.textAlign = 'center';
        const textX = item.x + item.width / 2 + textOffsetX;
        const lineY = textBlockY + i * lineHeight;

        if (item.textShadow ?? true) {
          const SHADOW_OFFSET = 2;
          ctx.fillStyle = item.textShadowColor || '#FFFFFF';
          ctx.fillText(line, textX - SHADOW_OFFSET, lineY - SHADOW_OFFSET);
          ctx.fillText(line, textX + SHADOW_OFFSET, lineY - SHADOW_OFFSET);
          ctx.fillText(line, textX - SHADOW_OFFSET, lineY + SHADOW_OFFSET);
          ctx.fillText(line, textX + SHADOW_OFFSET, lineY + SHADOW_OFFSET);
        }
        
        ctx.fillStyle = item.textColor || 'black';
        ctx.fillText(line, textX, lineY);
      }
    }
  }
  return canvas;
};
