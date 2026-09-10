import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { TitleImageCollections, TitleCollectionKey } from '../types';
import { BOX_PALETTE_CONFIG } from './TextEditModal';

interface AddChordModalProps {
  collections: TitleImageCollections;
  onAdd: (chordName: string, imageUrl: string, color: string, shadowColor: string, boxFilter: string) => void;
  onClose: () => void;
}

const NOTES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const SUFFIXES = ['', 'm', '7', 'm7', 'maj7', 'sus4', 'sus2', 'dim', 'aug', '6', 'm6', '9', 'm9', 'maj9'];

const BASIC_COLORS = [
  '#FFFFFF', '#FFF1E8', '#FFCCAA', '#C2C3C7', '#5F574F', '#000000',
  '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C',
  '#FF77A8', '#7E2553', '#AB5236', '#1D2B53', '#008751',
];

const AddChordModal: React.FC<AddChordModalProps> = ({ collections, onAdd, onClose }) => {
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [selectedSuffix, setSelectedSuffix] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<TitleCollectionKey>('x1');
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [selectedShadowColor, setSelectedShadowColor] = useState<string>('#FFFFFF');
  const [selectedBoxFilter, setSelectedBoxFilter] = useState<string>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredChord, setHoveredChord] = useState<string | null>(null);

  const allChords = useMemo(() => {
    const chords: string[] = [];
    NOTES.forEach(note => {
      SUFFIXES.forEach(suffix => {
        chords.push(`${note}${suffix}`);
      });
    });
    return chords;
  }, []);

  const filteredChords = useMemo(() => {
    return allChords.filter(chord => {
      const matchesSearch = chord.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRoot = selectedRoot ? chord.startsWith(selectedRoot) : true;
      const matchesSuffix = selectedSuffix !== null ? chord.endsWith(selectedSuffix) : true;
      
      // Special handling for root matches to avoid C# matching C
      if (selectedRoot && chord.length > selectedRoot.length) {
          const nextChar = chord[selectedRoot.length];
          if (nextChar === '#' || nextChar === 'b') return chord.startsWith(selectedRoot);
      }

      return matchesSearch && matchesRoot && matchesSuffix;
    });
  }, [allChords, searchQuery, selectedRoot, selectedSuffix]);

  const handleAdd = (chord: string) => {
    const availableImages = collections[selectedSize].filter((img): img is string => !!img);
    if (availableImages.length > 0) {
      onAdd(chord, availableImages[0], selectedColor, selectedShadowColor, selectedBoxFilter);
    }
  };

  const previewImage = useMemo(() => {
    const availableImages = collections[selectedSize].filter((img): img is string => !!img);
    return availableImages.length > 0 ? availableImages[0] : '';
  }, [collections, selectedSize]);

  return (
    <Modal onClose={onClose} title="Añadir Acorde" className="max-w-5xl">
      <div className="p-6 flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Configuration (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-sm uppercase font-bold tracking-wider opacity-70">Vista Previa</label>
              <div className="relative w-full h-32 pixel-content-box flex items-center justify-center bg-[#203c56] overflow-hidden">
                <img src={previewImage} alt="" className="w-full h-full object-contain opacity-50" referrerPolicy="no-referrer" style={{ filter: selectedBoxFilter }} />
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <span 
                    className="text-3xl font-bold text-center break-all"
                    style={{ 
                      color: selectedColor,
                      textShadow: `2px 2px ${selectedShadowColor}, -2px -2px ${selectedShadowColor}, 2px -2px ${selectedShadowColor}, -2px 2px ${selectedShadowColor}`
                    }}
                  >
                    {hoveredChord || 'Acorde'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] opacity-50 text-center uppercase">Pasa el ratón para previsualizar</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm uppercase font-bold tracking-wider opacity-70">Tamaño</label>
              <div className="flex gap-2">
                {(['x1/2', 'x1'] as TitleCollectionKey[]).map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`pixel-button flex-1 py-2 text-lg ${selectedSize === size ? 'pixel-button-active' : ''}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm uppercase font-bold tracking-wider opacity-70">Color de la Caja</label>
              <div className="flex flex-wrap gap-1.5 justify-center py-2 bg-black/20 rounded max-h-32 overflow-y-auto">
                {BOX_PALETTE_CONFIG.map((opt, idx) => (
                  <button
                    key={`box-color-${opt.hex}-${idx}`}
                    onClick={() => setSelectedBoxFilter(opt.filter)}
                    className={`w-8 h-8 pixel-panel border-2 transition-all ${selectedBoxFilter === opt.filter ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-white/10 opacity-70 hover:opacity-100 hover:scale-105'}`}
                    style={{ backgroundColor: opt.hex }}
                    title={opt.hex}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm uppercase font-bold tracking-wider opacity-70">Color del Texto</label>
              <div className="grid grid-cols-6 gap-1">
                {BASIC_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-full aspect-square border-2 ${selectedColor === color ? 'border-white scale-110 z-10' : 'border-black/20'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="relative w-full aspect-square pixel-panel bg-black/20 flex items-center justify-center overflow-hidden">
                  <input 
                    type="color" 
                    value={selectedColor} 
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-0"
                  />
                  <span className="text-[10px] pointer-events-none">+</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm uppercase font-bold tracking-wider opacity-70">Color de Sombra</label>
              <div className="grid grid-cols-6 gap-1">
                {BASIC_COLORS.map(color => (
                  <button
                    key={`shadow-${color}`}
                    onClick={() => setSelectedShadowColor(color)}
                    className={`w-full aspect-square border-2 ${selectedShadowColor === color ? 'border-white scale-110 z-10' : 'border-black/20'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="relative w-full aspect-square pixel-panel bg-black/20 flex items-center justify-center overflow-hidden">
                  <input 
                    type="color" 
                    value={selectedShadowColor} 
                    onChange={(e) => setSelectedShadowColor(e.target.value)}
                    className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-0"
                  />
                  <span className="text-[10px] pointer-events-none">+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Chord Selection (8 cols) */}

          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex flex-col gap-4 bg-black/20 p-4 pixel-panel">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase opacity-50">Filtros Rápidos</label>
                <div className="flex flex-wrap gap-1">
                  <button 
                    onClick={() => setSelectedRoot(null)}
                    className={`pixel-button px-3 py-1 text-xs ${selectedRoot === null ? 'pixel-button-active' : ''}`}
                  >
                    TODOS
                  </button>
                  {NOTES.map(note => (
                    <button
                      key={note}
                      onClick={() => setSelectedRoot(note === selectedRoot ? null : note)}
                      className={`pixel-button px-3 py-1 text-xs ${selectedRoot === note ? 'pixel-button-active' : ''}`}
                    >
                      {note}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <button 
                    onClick={() => setSelectedSuffix(null)}
                    className={`pixel-button px-3 py-1 text-xs ${selectedSuffix === null ? 'pixel-button-active' : ''}`}
                  >
                    CUALQUIERA
                  </button>
                  {SUFFIXES.map(suffix => (
                    <button
                      key={suffix}
                      onClick={() => setSelectedSuffix(suffix === selectedSuffix ? null : suffix)}
                      className={`pixel-button px-3 py-1 text-xs ${selectedSuffix === suffix ? 'pixel-button-active' : ''}`}
                    >
                      {suffix === '' ? 'MAJ' : suffix}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar acorde por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pixel-input w-full pl-10"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30">🔍</div>
              </div>
            </div>

            <div className="relative group">
              <div className="pixel-panel bg-black/40 p-3 h-[400px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 custom-scrollbar">
                {filteredChords.map(chord => (
                  <button
                    key={chord}
                    onClick={() => handleAdd(chord)}
                    onMouseEnter={() => setHoveredChord(chord)}
                    onMouseLeave={() => setHoveredChord(null)}
                    className="py-3 text-3xl font-bold hover:scale-105 transition-all flex items-center justify-center min-h-[70px] bg-white text-black border-4 border-black"
                    style={{ 
                        color: selectedColor,
                        textShadow: `1px 1px ${selectedShadowColor}, -1px -1px ${selectedShadowColor}, 1px -1px ${selectedShadowColor}, -1px 1px ${selectedShadowColor}`
                    }}
                  >
                    {chord}
                  </button>
                ))}
                {filteredChords.length === 0 && (
                  <div className="col-span-full text-center py-20 opacity-50 text-xl uppercase tracking-widest">
                    No se encontraron acordes
                  </div>
                )}
              </div>
              
              {/* Scroll indicators */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0d2b45] px-4 py-1 border border-white/20 rounded-full text-[10px] uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Desliza para ver más ↓
              </div>
            </div>
          </div>
        </div>

      </div>
      <div className="p-4 border-t border-white/10 flex justify-end bg-black/20">
        <button onClick={onClose} className="pixel-button px-8 py-2 bg-red-700 text-xl">
          Cerrar
        </button>
      </div>
    </Modal>
  );
};

export default AddChordModal;
