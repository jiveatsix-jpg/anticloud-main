import React, { useState } from 'react';
import { Board } from '../types';
import Modal from './Modal';

interface BoardSettingsModalProps {
  board: Board;
  onClose: () => void;
  onSave: (settings: Partial<Board>) => void;
}

const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({ board, onClose, onSave }) => {
  const [width, setWidth] = useState(board.width || 3000);
  const [height, setHeight] = useState(board.height || 2000);
  const [backgroundUrl, setBackgroundUrl] = useState(board.backgroundUrl || '');
  const [backgroundMode, setBackgroundMode] = useState(board.backgroundMode || 'expand');
  const [screenFilter, setScreenFilter] = useState(board.screenFilter || 'none');
  const [particles, setParticles] = useState(board.particles || 'none');

  const [isAdjusting, setIsAdjusting] = useState(false);

  const handleAdjustToImage = () => {
    if (!backgroundUrl) return;
    setIsAdjusting(true);
    const img = new Image();
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
      setIsAdjusting(false);
    };
    img.onerror = () => {
      setIsAdjusting(false);
    };
    img.src = backgroundUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setBackgroundUrl(url);
        
        // Automatically try to get dimensions for new uploads
        const img = new Image();
        img.onload = () => {
          setWidth(img.width);
          setHeight(img.height);
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({
      width: Number(width),
      height: Number(height),
      backgroundUrl,
      backgroundMode: backgroundMode as any,
      screenFilter: screenFilter as any,
      particles: particles as any,
    });
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title="Ajustes de Pizarra"
      className="max-w-md"
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="pixel-button flex-1 p-3 bg-white/10 hover:bg-white/20">
            Cancelar
          </button>
          <button onClick={handleSave} className="pixel-button flex-1 p-3 bg-indigo-600 hover:bg-indigo-500">
            Guardar Cambios
          </button>
        </div>
      }
    >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-white/70">Ancho (px)</label>
              <input 
                type="number" 
                value={width} 
                onChange={(e) => setWidth(Number(e.target.value))}
                className="pixel-input w-full"
                min="50"
                max="10000"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-white/70">Alto (px)</label>
              <input 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(Number(e.target.value))}
                className="pixel-input w-full"
                min="50"
                max="10000"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <label className="text-sm text-white/70">Fondo de Pizarra</label>
              {backgroundUrl && (
                <button 
                  onClick={handleAdjustToImage}
                  disabled={isAdjusting}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 underline uppercase tracking-wider"
                >
                  {isAdjusting ? 'Ajustando...' : 'Ajustar tamaño a imagen'}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={backgroundUrl} 
                onChange={(e) => setBackgroundUrl(e.target.value)}
                placeholder="URL de imagen o sube un archivo"
                className="pixel-input flex-1"
              />
              <label className="pixel-button p-2 bg-indigo-600 cursor-pointer flex items-center justify-center min-w-[44px]">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Modo de Fondo</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setBackgroundMode('tile')}
                className={`pixel-button p-2 text-xs ${backgroundMode === 'tile' ? 'pixel-button-active' : 'bg-white/5'}`}
              >
                Mosaico
              </button>
              <button 
                onClick={() => setBackgroundMode('expand')}
                className={`pixel-button p-2 text-xs ${backgroundMode === 'expand' ? 'pixel-button-active' : 'bg-white/5'}`}
              >
                Expandir
              </button>
              <button 
                onClick={() => setBackgroundMode('center')}
                className={`pixel-button p-2 text-xs ${backgroundMode === 'center' ? 'pixel-button-active' : 'bg-white/5'}`}
              >
                Centrar
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Filtro de Pantalla Retro</label>
            <select 
              value={screenFilter} 
              onChange={(e) => setScreenFilter(e.target.value as any)}
              className="pixel-input w-full"
            >
              <option value="none">Ninguno</option>
              <option value="crt">Monitor CRT (Líneas + Parpadeo)</option>
              <option value="sepia">Sepia (Antiguo)</option>
              <option value="grayscale">Escala de Grises</option>
              <option value="gameboy">GameBoy (Verde)</option>
              <option value="glitch">Glitch (Distorsión)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70">Efectos de Partículas</label>
            <select 
              value={particles} 
              onChange={(e) => setParticles(e.target.value as any)}
              className="pixel-input w-full"
            >
              <option value="none">Ninguno</option>
              <option value="rain">Lluvia</option>
              <option value="confetti">Confeti</option>
            </select>
          </div>
        </div>
    </Modal>
  );
};

export default BoardSettingsModal;
