import React from 'react';
import { BoardItem, ItemType } from '../types';
import { DeleteIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';

interface LayersModalProps {
  items: BoardItem[];
  onClose: () => void;
  onReorder: (id: string, direction: 'up' | 'down' | 'front' | 'back') => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  selectedItemIds: string[];
}

const LayersModal: React.FC<LayersModalProps> = ({ 
  items, 
  onClose, 
  onReorder, 
  onDelete, 
  onSelect,
  selectedItemIds 
}) => {
  // Items are rendered from back to front in the canvas, 
  // so the last item in the array is the one on top.
  // In the layers list, we want the top item to be at the top of the list.
  const reversedItems = [...items].reverse();

  const getItemLabel = (item: BoardItem) => {
    switch (item.type) {
      case ItemType.Title: return `Título: ${item.text.substring(0, 15)}...`;
      case ItemType.Textbox: return `Caja: ${item.text.substring(0, 15)}...`;
      case ItemType.Pixel: return `Pixel: ${item.id.split('_')[1] || 'Ilustración'}`;
      case ItemType.Sprite: return `Sprite: ${item.id.split('_')[1] || 'Animación'}`;
      case ItemType.Counter: return `Contador: ${item.counterValue}`;
      case ItemType.Timer: return `Temporizador: ${item.text}`;
      case ItemType.File: return `Archivo: ${item.fileName}`;
      case ItemType.Checkbox: return `Tarea: ${item.text.substring(0, 15)}...`;
      case ItemType.PlainText: return `Texto: ${item.text.substring(0, 15)}...`;
      case ItemType.Box: return `Caja: ${item.text.substring(0, 15)}...`;
      case ItemType.Frame: return `Marco: ${Math.round(item.width)}x${Math.round(item.height)}`;
      default: return item.type;
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="pixel-panel w-full max-w-md flex flex-col gap-6 max-h-[90vh]">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h2 className="text-2xl font-bold text-white neon-text uppercase tracking-tighter">Gestión de Capas</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="flex-1 overflow-auto pr-2 flex flex-col gap-2">
          {reversedItems.length === 0 ? (
            <p className="text-center text-white/40 py-8 italic">No hay elementos en esta pizarra</p>
          ) : (
            reversedItems.map((item, index) => (
              <div 
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`pixel-content-box flex items-center justify-between p-2 cursor-pointer transition-all ${selectedItemIds.includes(item.id) ? 'border-indigo-500 bg-indigo-900/30' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 bg-black/40 flex items-center justify-center border border-white/10 shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[10px] opacity-30">N/A</span>
                    )}
                  </div>
                  <span className="text-xs text-white/90 truncate font-mono">
                    {getItemLabel(item)}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onReorder(item.id, 'up'); }}
                    disabled={index === 0}
                    className="p-1 hover:bg-white/10 disabled:opacity-20 text-white/70"
                    title="Traer al frente"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onReorder(item.id, 'down'); }}
                    disabled={index === reversedItems.length - 1}
                    className="p-1 hover:bg-white/10 disabled:opacity-20 text-white/70"
                    title="Enviar al fondo"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="p-1 hover:bg-red-900/50 text-red-400"
                    title="Eliminar"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-white/10">
          <button onClick={onClose} className="pixel-button w-full p-3 bg-white/10 hover:bg-white/20">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LayersModal;
