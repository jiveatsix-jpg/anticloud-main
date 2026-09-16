import React, { useState } from 'react';
import { BoardItem } from '../types';
import Modal from './Modal';
import { getItemAccentColor } from './TextEditModal';
import { NotesIcon } from './Icons';

interface NotesModalProps {
  item: BoardItem;
  onSave: (item: BoardItem) => void;
  onClose: () => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ item, onSave, onClose }) => {
  const [notes, setNotes] = useState(item.notes || '');
  const accent = getItemAccentColor(item);

  return (
    <Modal
      onClose={onClose}
      title="Notas"
      className="max-w-3xl"
      icon={<div style={{ color: accent }}><NotesIcon /></div>}
      footer={
        <div className="flex justify-center items-center gap-4">
          <button onClick={onClose} className="pixel-button px-6 py-2 flex items-center gap-2 text-2xl bg-red-700 hover:bg-red-600">
            Cancelar
          </button>
          <button onClick={() => onSave({ ...item, notes })} className="pixel-button px-6 py-2 flex items-center gap-2 text-2xl bg-green-700 hover:bg-green-600">
            Guardar
          </button>
        </div>
      }
    >
      <div className="p-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={16}
          className="pixel-input w-full text-lg resize-y"
          style={{ borderColor: accent }}
          placeholder="Escribe tus notas aquí..."
        />
      </div>
    </Modal>
  );
};

export default NotesModal;
