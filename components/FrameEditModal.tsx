import React, { useState } from 'react';
import { BoardItem } from '../types';
import { FRAME_STYLES } from '../constants';

interface FrameEditModalProps {
  item: BoardItem;
  onClose: () => void;
  onSave: (updated: BoardItem) => void;
}

const FrameEditModal: React.FC<FrameEditModalProps> = ({ item, onClose, onSave }) => {
  const [currentUrl, setCurrentUrl] = useState(item.imageUrl);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="pixel-panel w-full max-w-md flex flex-col gap-5 bg-slate-900 p-5 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h2 className="text-2xl font-bold text-white neon-text uppercase tracking-tighter">Estilo del Marco</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="grid grid-cols-5 gap-3 overflow-y-auto">
          {FRAME_STYLES.map(style => (
            <button
              key={style.id}
              onClick={() => {
                setCurrentUrl(style.url);
                onSave({ ...item, imageUrl: style.url });
              }}
              className={`flex flex-col items-center gap-2 p-2 rounded-sm border-4 transition-all ${currentUrl === style.url ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 hover:border-slate-500'}`}
              title={style.label}
            >
              <img
                src={style.url}
                alt={style.label}
                className="w-12 h-12 object-fill"
                style={{ imageRendering: 'pixelated' }}
              />
              <span className="text-white font-mono text-[10px]">{style.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FrameEditModal;
