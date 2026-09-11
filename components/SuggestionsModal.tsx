import React, { useState, useEffect } from 'react';
import { DownloadIcon } from './Icons';
import { storage } from '../utils/storageUtils';
import Modal from './Modal';

interface SuggestionsModalProps {
  onClose: () => void;
}

const SuggestionsModal: React.FC<SuggestionsModalProps> = ({ onClose }) => {
  const [notes, setNotes] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    storage.getItem('pixelBoard_suggestions').then(saved => {
      if (saved) setNotes(saved);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) storage.setItem('pixelBoard_suggestions', notes);
  }, [notes, isLoaded]);

  const handleDownload = () => {
    const content = "NOTAS Y SUGERENCIAS - PIXEL BOARD\n\n" + notes;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mis_sugerencias_pixel_board.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      onClose={onClose}
      title="Mis Notas y Sugerencias"
      className="max-w-2xl"
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="pixel-button flex-1 p-3 bg-white/10 hover:bg-white/20">
            Cerrar
          </button>
          <button onClick={handleDownload} className="pixel-button flex-1 p-3 bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2">
            <DownloadIcon />
            Descargar .txt
          </button>
        </div>
      }
    >
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <p className="text-sm text-white/60 italic">
            Escribe aquí tus ideas, errores encontrados o cosas que te gustaría mejorar en la aplicación. Se guardará automáticamente.
          </p>
          
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="pixel-input w-full flex-1 min-h-[300px] resize-none text-lg leading-relaxed p-4"
            placeholder="Escribe tus sugerencias aquí..."
          />
        </div>
    </Modal>
  );
};

export default SuggestionsModal;
