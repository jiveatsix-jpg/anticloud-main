import React from 'react';
import { BoardItem } from '../types';
import { TrashIcon, PlusIcon } from './Icons';
import Modal from './Modal';

interface InventoryModalProps {
  inventory: BoardItem[];
  onClose: () => void;
  onAddItem: (item: BoardItem) => void;
  onRemoveItem: (id: string) => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ 
  inventory, 
  onClose, 
  onAddItem, 
  onRemoveItem 
}) => {
  return (
    <Modal
      onClose={onClose}
      title="Inventario Local"
      className="max-w-2xl"
      footer={
        <p className="text-[10px] text-white/50 font-mono text-center">
          Los elementos se guardan localmente en tu navegador.
        </p>
      }
    >
        <div className="flex-1 overflow-y-auto">
          {inventory.length === 0 ? (
            <div className="text-center py-12 text-white/50 font-mono italic">
              El inventario está vacío. Guarda elementos desde la pizarra.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="pixel-content-box hover:bg-white/5 transition-colors group relative"
                >
                  <div className="aspect-square flex items-center justify-center bg-black/40 rounded p-2 mb-2">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt="Item" 
                        className="max-w-full max-h-full object-contain pixelated"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-[10px] text-white/70 overflow-hidden text-center">
                        {item.text || item.type}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center gap-1">
                    <button 
                      onClick={() => onAddItem(item)}
                      className="pixel-button p-1 bg-green-600 flex-1 text-[10px]"
                      title="Añadir a la pizarra"
                    >
                      <PlusIcon />
                    </button>
                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="pixel-button p-1 bg-red-600"
                      title="Eliminar del inventario"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </Modal>
  );
};

export default InventoryModal;
