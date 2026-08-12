import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ArrowLeftIcon, ArrowRightIcon, SettingsIcon } from './Icons';

type PixelSize = 'x2' | 'x1' | 'x1/2' | 'x1/4';
const PIXEL_SIZES: PixelSize[] = ['x2', 'x1', 'x1/2', 'x1/4'];

interface AddElementModalProps {
  images: (string | null)[];
  onAdd: (imageUrl: string) => void;
  onClose: () => void;
  title: string;
  onEditImages?: (key: string) => void;
  showCollectionSelector?: boolean;
  collectionKeys?: string[];
  activeCollectionKey?: string;
  onCollectionChange?: (key: string) => void;
  collectionNames?: { [key: string]: string };
  onRenameCollection?: (key: string, newName: string) => void;
  showSizeMultiplier?: boolean;
  sizeMultiplier?: PixelSize;
  onSizeMultiplierChange?: (size: PixelSize) => void;
  addButtonLabel?: string;
  showPagination?: boolean;
}

const AddElementModal: React.FC<AddElementModalProps> = ({ 
  images, onAdd, onClose, title, onEditImages, 
  showCollectionSelector, collectionKeys, activeCollectionKey, onCollectionChange, 
  collectionNames, onRenameCollection,
  showSizeMultiplier, sizeMultiplier, onSizeMultiplierChange, addButtonLabel 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');

  const availableImages = images.filter((img): img is string => !!img);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? availableImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === availableImages.length - 1 ? 0 : prev + 1));
  };

  const handleAdd = () => {
    if (availableImages.length > 0) {
      onAdd(availableImages[currentIndex]);
      onClose();
    }
  };

  const handleStartRename = () => {
    if (activeCollectionKey && collectionNames) {
      setNewName(collectionNames[activeCollectionKey] || activeCollectionKey);
      setIsRenaming(true);
    }
  };

  const handleSaveRename = () => {
    if (activeCollectionKey && onRenameCollection && newName.trim()) {
      onRenameCollection(activeCollectionKey, newName.trim());
      setIsRenaming(false);
    }
  };

  const activeName = activeCollectionKey && collectionNames 
    ? collectionNames[activeCollectionKey] 
    : activeCollectionKey;

  const modalTitle = showCollectionSelector && activeName
    ? `${title} (${activeName})`
    : title;

  return (
    <Modal onClose={onClose} title={modalTitle} className="max-w-4xl">
      <div className="flex flex-col md:flex-row gap-6 p-4">
        {/* Left: Preview */}
        <div className="flex-1 flex flex-col gap-4">
            <div className="w-full h-64 pixel-content-box flex items-center justify-center bg-[#1a1a1a]">
            {availableImages.length > 0 ? (
                <img src={availableImages[currentIndex]} alt="Preview" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
                <p className="text-center p-4">No hay imágenes disponibles. ¡Sube algunas en Ajustes!</p>
            )}
            </div>
            
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-4">
                <button onClick={handlePrev} className="pixel-button p-3" disabled={availableImages.length <= 1}>
                    <ArrowLeftIcon />
                </button>
                <span className="text-2xl min-w-[80px] text-center">{availableImages.length > 0 ? currentIndex + 1 : 0} / {availableImages.length}</span>
                <button onClick={handleNext} className="pixel-button p-3" disabled={availableImages.length <= 1}>
                    <ArrowRightIcon />
                </button>
                </div>
            </div>
        </div>

        {/* Right: Controls */}
        <div className="w-px bg-[var(--pixel-border-color)] hidden md:block"></div>
        <div className="flex-1 flex flex-col gap-6 justify-center">
            <div className="flex flex-col gap-4">
                {showCollectionSelector && activeCollectionKey && onCollectionChange && collectionKeys && (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm uppercase opacity-70">Colección</label>
                            {onRenameCollection && (
                                <button onClick={handleStartRename} className="text-xs text-blue-400 hover:underline">
                                    Cambiar Nombre
                                </button>
                            )}
                        </div>

                        {isRenaming ? (
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newName} 
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="pixel-input flex-1 px-2 py-1 bg-black/40 border border-white/20"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                                />
                                <button onClick={handleSaveRename} className="pixel-button px-2 py-1 bg-green-700">OK</button>
                                <button onClick={() => setIsRenaming(false)} className="pixel-button px-2 py-1 bg-red-700">X</button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 pixel-panel p-2 bg-black/20 max-h-40 overflow-y-auto">
                                {collectionKeys.map(key => (
                                    <button
                                        key={key}
                                        onClick={() => onCollectionChange(key)}
                                        className={`pixel-button px-4 py-1 text-sm flex-1 min-w-[100px] ${activeCollectionKey === key ? 'pixel-button-active' : ''}`}
                                        title={collectionNames?.[key] || key}
                                    >
                                        {collectionNames?.[key] || key}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {showSizeMultiplier && onSizeMultiplierChange && sizeMultiplier && (
                    <div className="flex flex-col gap-2">
                        <label className="text-sm uppercase opacity-70">Multiplicador de Tamaño</label>
                        <div className="flex flex-wrap gap-2 pixel-panel p-2 bg-black/20">
                            {PIXEL_SIZES.map(size => (
                                <button
                                    key={size}
                                    onClick={() => onSizeMultiplierChange(size)}
                                    className={`pixel-button px-4 py-1 text-lg flex-1 ${sizeMultiplier === size ? 'pixel-button-active' : ''}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 mt-auto pt-4 border-t border-white/10">
                <button onClick={onClose} className="pixel-button text-xl px-6 py-2 bg-red-700 hover:bg-red-600">
                    Cancelar
                </button>
                <button onClick={handleAdd} className="pixel-button text-xl px-6 py-2 bg-green-700 hover:bg-green-600" disabled={availableImages.length === 0}>
                    {addButtonLabel || 'Añadir'}
                </button>
                {onEditImages && (
                    <button onClick={() => onEditImages(activeCollectionKey || '')} className="pixel-button p-3" title="Editar Imágenes">
                        <SettingsIcon />
                    </button>
                )}
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddElementModal;