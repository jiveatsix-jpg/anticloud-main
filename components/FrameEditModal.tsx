import React, { useState } from 'react';
import { BoardItem } from '../types';
import { FRAME_STYLES } from '../constants';
import Modal from './Modal';

interface FrameEditModalProps {
  item: BoardItem;
  onClose: () => void;
  onSave: (updated: BoardItem) => void;
}

const FrameEditModal: React.FC<FrameEditModalProps> = ({ item, onClose, onSave }) => {
  const [currentUrl, setCurrentUrl] = useState(item.imageUrl);

  return (
    <Modal onClose={onClose} title="Estilo del Marco" className="max-w-md">
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
    </Modal>
  );
};

export default FrameEditModal;
