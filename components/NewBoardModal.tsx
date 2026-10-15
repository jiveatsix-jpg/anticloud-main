import React, { useState } from 'react';
import { BoardSize } from '../types';
import Modal from './Modal';
import { BOARD_MAX_SIZE, BOARD_MIN_SIZE, BOARD_SIZE_PRESETS, DEFAULT_BOARD_HEIGHT, DEFAULT_BOARD_WIDTH } from '../constants';
import { clampBoardSize } from '../utils/boardUtils';

interface NewBoardModalProps {
  onClose: () => void;
  onCreate: (size: BoardSize) => void;
}

const CUSTOM_ID = 'custom';
const PREVIEW_BOX_WIDTH = 192;
const PREVIEW_BOX_HEIGHT = 112;

const parseDimension = (raw: string) => (raw.trim() === '' ? NaN : Number(raw));

const isInRange = (value: number) => Number.isFinite(value) && value >= BOARD_MIN_SIZE && value <= BOARD_MAX_SIZE;

const NewBoardModal: React.FC<NewBoardModalProps> = ({ onClose, onCreate }) => {
  const [selectedId, setSelectedId] = useState(BOARD_SIZE_PRESETS[0].id);
  const [customWidth, setCustomWidth] = useState(String(DEFAULT_BOARD_WIDTH));
  const [customHeight, setCustomHeight] = useState(String(DEFAULT_BOARD_HEIGHT));

  const isCustom = selectedId === CUSTOM_ID;
  const selectedPreset = BOARD_SIZE_PRESETS.find(p => p.id === selectedId);

  let size: BoardSize | null = null;
  if (selectedPreset) {
    size = { width: selectedPreset.width, height: selectedPreset.height };
  } else {
    const width = parseDimension(customWidth);
    const height = parseDimension(customHeight);
    if (isInRange(width) && isInRange(height)) {
      size = {
        width: clampBoardSize(width, DEFAULT_BOARD_WIDTH),
        height: clampBoardSize(height, DEFAULT_BOARD_HEIGHT),
      };
    }
  }

  const handleSelectCustom = () => {
    if (isCustom) return;
    if (size) {
      setCustomWidth(String(size.width));
      setCustomHeight(String(size.height));
    }
    setSelectedId(CUSTOM_ID);
  };

  const handleCreate = () => {
    if (size) onCreate(size);
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreate();
  };

  // The preview is bounded by a fixed box: the longer side fills it and CSS aspect-ratio derives the other.
  const previewStyle: React.CSSProperties | null = size
    ? {
        aspectRatio: `${size.width} / ${size.height}`,
        ...(size.width / size.height >= PREVIEW_BOX_WIDTH / PREVIEW_BOX_HEIGHT
          ? { width: PREVIEW_BOX_WIDTH }
          : { height: PREVIEW_BOX_HEIGHT }),
      }
    : null;

  return (
    <Modal
      onClose={onClose}
      title="Nueva Pizarra"
      className="max-w-2xl"
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="pixel-button flex-1 p-3 bg-white/10 hover:bg-white/20">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!size}
            className="pixel-button flex-1 p-3 bg-indigo-600 hover:bg-indigo-500"
          >
            Crear Pizarra
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-white/70">Tamaño de la pizarra</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BOARD_SIZE_PRESETS.map(preset => {
              const isDefault = preset.width === DEFAULT_BOARD_WIDTH && preset.height === DEFAULT_BOARD_HEIGHT;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedId(preset.id)}
                  className={`pixel-button p-2 text-left ${selectedId === preset.id ? 'pixel-button-active' : 'bg-white/5'}`}
                >
                  <span className="block text-sm">{preset.label}</span>
                  <span className="block text-[10px] text-white/60 font-mono">
                    {preset.width} × {preset.height} px{isDefault ? ' · por defecto' : ''}
                  </span>
                </button>
              );
            })}
            <button
              onClick={handleSelectCustom}
              className={`pixel-button p-2 text-left col-span-2 sm:col-span-3 ${isCustom ? 'pixel-button-active' : 'bg-white/5'}`}
            >
              <span className="block text-sm">Personalizado</span>
              <span className="block text-[10px] text-white/60 font-mono">Elige el ancho y el alto</span>
            </button>
          </div>
        </div>

        {isCustom && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="new-board-width" className="text-sm text-white/70">Ancho (px)</label>
                <input
                  id="new-board-width"
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  onKeyDown={handleCustomKeyDown}
                  className="pixel-input w-full"
                  min={BOARD_MIN_SIZE}
                  max={BOARD_MAX_SIZE}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="new-board-height" className="text-sm text-white/70">Alto (px)</label>
                <input
                  id="new-board-height"
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  onKeyDown={handleCustomKeyDown}
                  className="pixel-input w-full"
                  min={BOARD_MIN_SIZE}
                  max={BOARD_MAX_SIZE}
                />
              </div>
            </div>
            {!size && (
              <p role="alert" className="text-sm text-red-400">
                El ancho y el alto deben ser números entre {BOARD_MIN_SIZE} y {BOARD_MAX_SIZE} px.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <div
            className="flex items-center justify-center"
            style={{ width: PREVIEW_BOX_WIDTH, height: PREVIEW_BOX_HEIGHT }}
          >
            {previewStyle && (
              <div
                className="border-2 border-[var(--pixel-highlight-color)] bg-[var(--pixel-content-bg-color)]"
                style={previewStyle}
              />
            )}
          </div>
          <span className="text-[10px] text-white/60 font-mono">
            {size ? `${size.width} × ${size.height} px` : '— × — px'}
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default NewBoardModal;
