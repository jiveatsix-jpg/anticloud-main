import { Board, BoardItem } from '../types';
import { FONT_FACES } from '../constants';

interface ConnectableRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where a connection line should touch `from`'s box: the midpoint of whichever
 * side (top/bottom/left/right) faces `to`, instead of `from`'s raw center —
 * so a link coming from roughly the side sits flush on that side instead of
 * cutting across the box diagonally.
 */
export const getEdgeConnectionPoint = (from: ConnectableRect, to: ConnectableRect): { x: number; y: number } => {
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;
  if (dx === 0 && dy === 0) return { x: fromCenterX, y: fromCenterY };

  const halfWidth = from.width / 2;
  const halfHeight = from.height / 2;
  // Compare the direction against the box's own aspect ratio (not a raw 45°
  // split) so a wide box favors exiting left/right over top/bottom, and vice versa.
  if (Math.abs(dx) * halfHeight > Math.abs(dy) * halfWidth) {
    return { x: fromCenterX + (dx > 0 ? halfWidth : -halfWidth), y: fromCenterY };
  }
  return { x: fromCenterX, y: fromCenterY + (dy > 0 ? halfHeight : -halfHeight) };
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
  const boardWidth = captureArea ? captureArea.width : 3000;
  const boardHeight = captureArea ? captureArea.height : 2000;

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
  } else {
    ctx.fillStyle = '#000000';
    if (captureArea) {
      ctx.fillRect(captureArea.x, captureArea.y, captureArea.width, captureArea.height);
    } else {
      ctx.fillRect(0, 0, boardWidth, boardHeight);
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

    ctx.drawImage(img, item.x, item.y, item.width, item.height);

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
