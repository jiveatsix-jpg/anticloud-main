import React, { useState, useEffect, useRef } from 'react';
import { BoardItem } from '../types';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
import { FONT_FACES } from '../constants';
import {
  EditIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CopyIcon,
  PasteIcon,
  PlusIcon,
  DeleteIcon
} from './Icons';
import { TitleImageCollections, TextboxImageCollections, TitleCollectionKey, TextboxCollectionKey, ItemType } from '../types';

interface TextEditModalProps {
  item: BoardItem;
  onSave: (item: BoardItem) => void;
  onClose: () => void;
  boardsLength: number;
  activeBoardIndex: number;
  onSendToBoard: (itemId: string, targetBoardIndex: number) => void;
  titleImages: TitleImageCollections;
  textboxImages: TextboxImageCollections;
  activeFragmentIndex?: number;
}

// A curated palette of basic colors suitable for pixel art.
const BASIC_COLORS = [
  '#FFFFFF', '#FFF1E8', '#FFCCAA', '#C2C3C7', '#5F574F', '#000000',
  '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C',
  '#FF77A8', '#7E2553', '#AB5236', '#1D2B53', '#008751',
];

// Precise mapping of PICO-8 colors to CSS filters starting from the Blue/Cyan box sprite (#32A1D7)
const BOX_PALETTE_CONFIG = [
  { hex: '#FFFFFF', filter: 'brightness(0.5) invert(1) grayscale(1) contrast(1.5)' }, // Inverted White (User liked this)
  { hex: '#FFF1E8', filter: 'grayscale(1) brightness(1.8) sepia(0.3) saturate(1)' }, // Natural Cream
  { hex: '#FFCCAA', filter: 'sepia(1) hue-rotate(340deg) saturate(1.5) brightness(1.5)' }, // Warm Creamy Peach
  { hex: '#C2C3C7', filter: 'grayscale(1) brightness(1.3)' },
  { hex: '#5F574F', filter: 'grayscale(1) brightness(0.6)' },
  { hex: '#000000', filter: 'brightness(1.9) invert(1) grayscale(1) contrast(1.2)' }, // Corrected Black body with light details
  { hex: '#FF004D', filter: 'hue-rotate(142deg) saturate(2.5) brightness(0.8)' },
  { hex: '#FFA300', filter: 'hue-rotate(195deg) saturate(2.5) brightness(1.1)' },
  { hex: '#FFEC27', filter: 'hue-rotate(215deg) saturate(2.5) brightness(1.2)' },
  { hex: '#00E436', filter: 'hue-rotate(294deg) saturate(2.5) brightness(0.9)' },
  { hex: '#29ADFF', filter: 'none' }, // Original Blue (Default Sprite Color)
  { hex: '#83769C', filter: 'hue-rotate(58deg) saturate(0.5) brightness(0.9)' },
  { hex: '#FF77A8', filter: 'hue-rotate(135deg) saturate(1.8) brightness(1.2)' },
  { hex: '#7E2553', filter: 'hue-rotate(125deg) saturate(1.5) brightness(0.5)' },
  { hex: '#AB5236', filter: 'hue-rotate(175deg) saturate(1.5) brightness(0.7)' },
  { hex: '#1D2B53', filter: 'hue-rotate(25deg) saturate(1.2) brightness(0.3)' },
  { hex: '#008751', filter: 'hue-rotate(316deg) saturate(1.5) brightness(0.5)' },
  // Sweetie-16 (GrafxKid) added on top of the base PICO-8 set, same hue-rotate/saturate/brightness technique.
  { hex: '#1a1c2c', filter: 'hue-rotate(30deg) saturate(0.65) brightness(0.25)' },
  { hex: '#5d275d', filter: 'hue-rotate(97deg) saturate(1) brightness(0.45)' },
  { hex: '#b13e53', filter: 'hue-rotate(146deg) saturate(1.2) brightness(0.8)' },
  { hex: '#ef7d57', filter: 'hue-rotate(172deg) saturate(2.1) brightness(1.1)' },
  { hex: '#ffcd75', filter: 'hue-rotate(195deg) saturate(1.6) brightness(1.55)' },
  { hex: '#a7f070', filter: 'hue-rotate(251deg) saturate(2) brightness(1.2)' },
  { hex: '#38b764', filter: 'hue-rotate(298deg) saturate(1.3) brightness(0.8)' },
  { hex: '#257179', filter: 'hue-rotate(343deg) saturate(1.3) brightness(0.55)' },
  { hex: '#29366f', filter: 'hue-rotate(26deg) saturate(1.15) brightness(0.5)' },
  { hex: '#3b5dc9', filter: 'hue-rotate(23deg) saturate(1.4) brightness(0.9)' },
  { hex: '#41a6f6', filter: 'hue-rotate(4deg) saturate(2.2) brightness(1.05)' },
  { hex: '#73eff7', filter: 'hue-rotate(341deg) saturate(2.2) brightness(1.2)' },
  { hex: '#f4f4f4', filter: 'grayscale(1) brightness(1.7)' },
  { hex: '#94b0c2', filter: 'saturate(0.65) brightness(1.15)' },
  { hex: '#566c86', filter: 'hue-rotate(10deg) saturate(0.55) brightness(0.75)' },
  { hex: '#333c57', filter: 'hue-rotate(22deg) saturate(0.65) brightness(0.47)' },
];

const TextEditModal: React.FC<TextEditModalProps> = ({
  item,
  onSave,
  onClose,
  boardsLength,
  activeBoardIndex,
  onSendToBoard,
  titleImages,
  textboxImages,
  activeFragmentIndex
}) => {
  const [editedItem, setEditedItem] = useState<BoardItem>(item);
  const [focusedFragmentIndex, setFocusedFragmentIndex] = useState<number | undefined>(activeFragmentIndex ?? item.editingFragmentIndex);
  const itemRef = useRef(item);
  const [activeTab, setActiveTab] = useState<'text' | 'style' | 'effects' | 'anim'>('text');
  const [currentCollection, setCurrentCollection] = useState<string>('x1');
  const [bpm, setBpm] = useState<number>(Math.round(60000 / (item.blinkInterval || 500)));
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [previewFrameIndex, setPreviewFrameIndex] = useState(0);

  useEffect(() => {
    setEditedItem(item);
    setFocusedFragmentIndex(item.editingFragmentIndex);
    if (item.blinkInterval) {
      setBpm(Math.round(60000 / item.blinkInterval));
    }
  }, [item]);

  // MOTOR DE PREVISUALIZACIÓN RÍTMICA (ESTADOS)
  useEffect(() => {
    let sequence = editedItem.animationHueFilters || (editedItem.secondaryBoxFilter ? [editedItem.boxFilter || 'none', editedItem.secondaryBoxFilter] : []);

    if (sequence.length > 1 && editedItem.blinkInterval) {
      const intervalId = setInterval(() => {
        setPreviewFrameIndex(prev => (prev + 1) % sequence.length);
      }, editedItem.blinkInterval);
      return () => clearInterval(intervalId);
    } else {
      setPreviewFrameIndex(0);
    }
  }, [editedItem.boxFilter, editedItem.secondaryBoxFilter, JSON.stringify(editedItem.animationHueFilters), editedItem.blinkInterval]);

  // Filtro de previsualización derivado
  const activePreviewSequence = editedItem.animationHueFilters || (editedItem.secondaryBoxFilter ? [editedItem.boxFilter || 'none', editedItem.secondaryBoxFilter] : []);
  const activePreviewFilter = activePreviewSequence.length > 1 
    ? activePreviewSequence[previewFrameIndex % activePreviewSequence.length] 
    : (editedItem.boxFilter || 'none');

  const handleSave = () => {
    onSave(editedItem);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setEditedItem(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'blinkInterval') {
      const val = Number(value);
      setEditedItem(prev => ({ ...prev, blinkInterval: val }));
      setBpm(Math.round(60000 / val));
    } else {
      setEditedItem(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    }
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = Number(e.target.value) || 0;
    setBpm(newBpm);
    if (newBpm > 0) {
      const newInterval = Math.round(60000 / newBpm);
      setEditedItem(prev => ({ ...prev, blinkInterval: newInterval }));
    }
  };

  const handleSelectChange = (name: keyof BoardItem, value: string) => {
    setEditedItem(prev => ({ ...prev, [name]: value }));
  };

  const handleColorPaletteClick = (name: 'textColor' | 'textShadowColor', color: string) => {
    setEditedItem(prev => ({ ...prev, [name]: color }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setEditedItem(prev => ({
          ...prev,
          fileName: file.name,
          fileContent: content,
          text: file.name
        }));
      };
      reader.readAsText(file);
    }
  };

  const handlePaste = async (name: 'text' | 'counterValue') => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (name === 'counterValue') {
          const val = Number(text);
          if (!isNaN(val)) {
            setEditedItem(prev => ({ ...prev, counterValue: val, text: String(val) }));
          }
        } else {
          setEditedItem(prev => ({ ...prev, text: text, textFragments: undefined }));
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleAddFragment = () => {
    setEditedItem(prev => {
      const fragments = prev.textFragments || [{ text: prev.text || '', color: prev.textColor }];
      return {
        ...prev,
        textFragments: [...fragments, { text: '', color: prev.textColor }]
      };
    });
  };

  const handleRemoveFragment = (index: number) => {
    setEditedItem(prev => {
      const fragments = [...(prev.textFragments || [])];
      fragments.splice(index, 1);
      const newText = fragments.map(f => f.text).join('');
      return {
        ...prev,
        textFragments: fragments.length > 0 ? fragments : undefined,
        text: fragments.length > 0 ? newText : prev.text
      };
    });
  };

  const handleFragmentChange = (index: number, field: 'text' | 'color' | 'shadowColor' | 'hasShadow', value: any) => {
    setEditedItem(prev => {
      const fragments = [...(prev.textFragments || [])];
      fragments[index] = { ...fragments[index], [field]: value };
      const newText = fragments.map(f => f.text).join('');
      return {
        ...prev,
        textFragments: fragments,
        text: newText
      };
    });
  };

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImageSelect = (imageUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const newWidth = img.naturalWidth;
      const newHeight = img.naturalHeight;

      setEditedItem(prev => {
        const boardWidth = 3000;
        const boardHeight = 2000;

        // Ensure the item stays within board boundaries after resize
        const newX = Math.max(0, Math.min(prev.x, boardWidth - newWidth));
        const newY = Math.max(0, Math.min(prev.y, boardHeight - newHeight));

        return {
          ...prev,
          imageUrl,
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY
        };
      });
    };
    img.onerror = () => {
      console.error("Failed to load image for dimensions, using fallback:", imageUrl);
      // Fallback: update image URL even if dimensions couldn't be loaded
      setEditedItem(prev => ({ ...prev, imageUrl }));
    };
    img.src = imageUrl;
  };

  const fontOptions = FONT_FACES.map(font => ({
    value: font,
    label: font.split(',')[0].replace(/'/g, ''),
  }));

  const textShadowStyle = (editedItem.textShadow ?? true)
    ? `2px 2px ${editedItem.textShadowColor || '#FFFFFF'}, -2px -2px ${editedItem.textShadowColor || '#FFFFFF'}, 2px -2px ${editedItem.textShadowColor || '#FFFFFF'}, -2px 2px ${editedItem.textShadowColor || '#FFFFFF'}`
    : 'none';

  const isTitle = item.type === ItemType.Title;
  const isNineSliceItem = item.type === ItemType.Box;
  const collections = isTitle ? titleImages : textboxImages;
  const collectionKeys = isTitle ? ['x1/2', 'x1', 'x2', 'x3', 'x4'] : ['x1', 'x4', 'x16'];

  return (
    <Modal onClose={onClose} title="Editar Elemento" className="max-w-5xl">
      <div className="flex flex-col md:flex-row gap-4 p-4 max-h-[85vh]">
        {/* Left Column: Preview & Tabs */}
        <div className="flex-[1.2] flex flex-col gap-4 overflow-y-auto min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl" style={{ textShadow: '2px 2px #0d2b45' }}>Vista Previa</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('text')}
                className={`pixel-button px-3 py-1 text-sm ${activeTab === 'text' ? 'pixel-button-active' : ''}`}
              >
                Texto
              </button>
              <button
                onClick={() => setActiveTab('style')}
                className={`pixel-button px-3 py-1 text-sm ${activeTab === 'style' ? 'pixel-button-active' : ''}`}
              >
                Hue
              </button>
              <button
                onClick={() => setActiveTab('effects')}
                className={`pixel-button px-3 py-1 text-sm ${activeTab === 'effects' ? 'pixel-button-active' : ''}`}
              >
                Efectos
              </button>
              <button
                onClick={() => setActiveTab('anim')}
                className={`pixel-button px-3 py-1 text-sm ${activeTab === 'anim' ? 'pixel-button-active' : ''}`}
              >
                Anim
              </button>
            </div>
          </div>

          <div className="relative w-full h-56 pixel-content-box flex items-center justify-center bg-[#203c56] overflow-hidden">
            <div className={`absolute inset-0 flex items-center justify-center ${[
                editedItem.neonGlow ? 'neon-text' : '',
                editedItem.floating ? 'effect-floating' : '',
                editedItem.glitch ? 'effect-glitch' : '',
                editedItem.rainbow ? 'effect-rainbow' : '',
                editedItem.scanlines ? 'effect-scanlines' : '',
                editedItem.terminalScan ? 'effect-terminal-scan' : '',
                editedItem.shake ? 'effect-shake' : '',
                editedItem.pulse ? 'effect-pulse' : '',
                editedItem.blur ? 'effect-blur' : '',
              ].filter(Boolean).join(' ')
              }`}>
              <div className="absolute inset-0 flex items-center justify-center">
                {!editedItem.type || editedItem.type !== ItemType.PlainText ? (
                  <div
                    className="w-full h-full relative"
                    style={{ 
                      filter: activePreviewFilter
                    }}
                  >
                    {isNineSliceItem ? (
                      (() => {
                        const s = editedItem.borderSlice || { top: 18, right: 31, bottom: 24, left: 28 };
                        return (
                          <div
                            className="absolute inset-0"
                            style={{
                              borderStyle: 'solid',
                              borderWidth: `${s.top}px ${s.right}px ${s.bottom}px ${s.left}px`,
                              borderImage: `url("${editedItem.imageUrl}") ${s.top} ${s.right} ${s.bottom} ${s.left} fill stretch`,
                              imageRendering: 'pixelated'
                            }}
                          />
                        );
                      })()
                    ) : (
                      <img src={editedItem.imageUrl} alt="" className="w-full h-full object-contain pointer-events-none" referrerPolicy="no-referrer" />
                    )}
                  </div>
                ) : null}
              </div>
              <div
                className={`absolute inset-0 p-4 flex items-center justify-center pointer-events-none`}
                style={{
                  transform: `translate(${editedItem.textOffsetX || 0}px, ${editedItem.textOffsetY || 0}px)`,
                  filter: editedItem.neonGlow ? `drop-shadow(0 0 10px ${editedItem.neonColor || '#00ff00'}) drop-shadow(0 0 20px ${editedItem.neonColor || '#00ff00'})` : 'none'
                }}
              >
                <div className="flex items-center gap-2">
                  {editedItem.type === ItemType.Checkbox && (
                    <div className={`w-6 h-6 border-2 border-current flex items-center justify-center bg-white/10`}>
                      {editedItem.checked && <div className="w-4 h-4 bg-current" />}
                    </div>
                  )}
                  <p
                    className={`whitespace-pre-wrap break-words pixel-text`}
                    style={{
                      color: editedItem.textColor || '#000000',
                      fontFamily: editedItem.fontFamily || 'inherit',
                      textShadow: (editedItem.textFragments && editedItem.textFragments.length > 0) ? 'none' : textShadowStyle,
                      fontSize: `${editedItem.fontSize || 24}px`,
                      lineHeight: 1.2,
                      textAlign: editedItem.textAlign || 'center',
                      textTransform: editedItem.textTransform || 'none',
                      textDecoration: (editedItem.type === ItemType.Checkbox && editedItem.checked) ? 'line-through' : 'none',
                      opacity: (editedItem.type === ItemType.Checkbox && editedItem.checked) ? 0.6 : 1,
                    }}
                  >
                    {editedItem.textFragments && editedItem.textFragments.length > 0 ? (
                      editedItem.textFragments.map((frag, i) => {
                        const fragShadowColor = frag.shadowColor || editedItem.textShadowColor || '#FFFFFF';
                        const fragHasShadow = frag.hasShadow ?? editedItem.textShadow ?? true;
                        const fragShadowStyle = fragHasShadow
                          ? `2px 2px ${fragShadowColor}, -2px -2px ${fragShadowColor}, 2px -2px ${fragShadowColor}, -2px 2px ${fragShadowColor}`
                          : 'none';
                        return (
                          <span key={i} style={{ color: frag.color || editedItem.textColor || '#000000', textShadow: fragShadowStyle }}>
                            {frag.text}
                          </span>
                        );
                      })
                    ) : (
                      editedItem.text || 'Aa Bb Cc'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* LED INDICATORS (RHYTHM FEEDBACK) */}
            {(() => {
              const sequence = editedItem.animationHueFilters || (editedItem.secondaryBoxFilter ? [editedItem.boxFilter || 'none', editedItem.secondaryBoxFilter] : []);
              if (sequence.length <= 1) return null;
              
              return (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-black/40 rounded-full border border-white/10 backdrop-blur-sm shadow-xl">
                  {sequence.map((_, i) => {
                    const isActive = previewFrameIndex === i;
                    const isEditing = selectedFrameIndex === i;
                    
                    return (
                      <div 
                        key={`led-${i}`} 
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                          isActive 
                            ? 'bg-[#00ff00] shadow-[0_0_10px_#00ff00] opacity-100' 
                            : 'bg-white/10 opacity-30'
                        } ${isEditing ? 'ring-2 ring-white ring-offset-1 ring-offset-black/20 scale-110 z-10' : ''}`}
                      />
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {activeTab === 'style' ? (
            <div className="flex flex-col gap-3">
              {/* SECCIÓN COMENTADA POR SEGURIDAD - SISTEMA DE MARCOS ANTIGUO */}
              <div className="flex flex-col gap-2 p-2 pixel-panel bg-black/30">
                <label className="text-sm uppercase opacity-70 text-violet-400">Color de la Caja (Paleta Exacta)</label>
                <div className="flex flex-wrap gap-1.5 justify-center py-2 bg-black/20 rounded">
                  {BOX_PALETTE_CONFIG.map((opt, idx) => (
                    <button
                      key={`box-color-${opt.hex}-${idx}`}
                      onClick={() => setEditedItem(prev => ({ ...prev, boxFilter: opt.filter }))}
                      className={`w-10 h-10 pixel-panel border-2 transition-all ${(editedItem.boxFilter || 'none') === opt.filter ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-white/10 opacity-70 hover:opacity-100 hover:scale-105'}`}
                      style={{
                        backgroundColor: opt.hex,
                      }}
                      title={opt.hex}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'effects' ? (
            <div className="flex flex-col gap-4 p-2 pixel-panel bg-black/30">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors">
                  <input
                    type="checkbox"
                    name="neonGlow"
                    checked={editedItem.neonGlow || false}
                    onChange={handleInputChange}
                    className="w-6 h-6"
                  />
                  <span className="text-xl font-bold text-cyan-400" style={{ textShadow: '0 0 10px #22d3ee' }}>BRILLO NEÓN</span>
                </label>

                {editedItem.neonGlow && (
                  <div className="flex flex-col gap-3 pl-9 animate-in fade-in slide-in-from-left-2 mb-2">
                    <label className="text-sm uppercase opacity-70">Color del Neón</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Cyan', color: '#00ffff' },
                        { name: 'Verde', color: '#00ff00' },
                        { name: 'Rosa', color: '#ff00ff' },
                        { name: 'Amarillo', color: '#ffff00' },
                        { name: 'Rojo', color: '#ff0000' },
                        { name: 'Naranja', color: '#ff8800' },
                        { name: 'Blanco', color: '#ffffff' }
                      ].map(opt => (
                        <button
                          key={opt.color}
                          onClick={() => setEditedItem(prev => ({ ...prev, neonColor: opt.color }))}
                          className={`w-10 h-10 pixel-panel border-2 transition-all ${editedItem.neonColor === opt.color ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          style={{
                            backgroundColor: opt.color,
                            boxShadow: editedItem.neonColor === opt.color ? `0 0 15px ${opt.color}` : 'none'
                          }}
                          title={opt.name}
                        />
                      ))}
                    </div>
                    <div className="pixel-input p-1 flex items-center mt-2">
                      <input
                        type="color"
                        value={editedItem.neonColor || '#00ff00'}
                        onChange={(e) => setEditedItem(prev => ({ ...prev, neonColor: e.target.value }))}
                        className="w-8 h-8"
                      />
                      <input
                        type="text"
                        value={editedItem.neonColor || '#00ff00'}
                        onChange={(e) => setEditedItem(prev => ({ ...prev, neonColor: e.target.value }))}
                        className="bg-transparent border-none text-white text-sm w-full ml-3 uppercase font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors border border-white/5">
                    <input
                      type="checkbox"
                      name="floating"
                      checked={editedItem.floating || false}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Levitación</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors border border-white/5">
                    <input
                      type="checkbox"
                      name="glitch"
                      checked={editedItem.glitch || false}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Error (Glitch)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors border border-white/5">
                    <input
                      type="checkbox"
                      name="rainbow"
                      checked={editedItem.rainbow || false}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Arcoíris</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors border border-white/5">
                    <input
                      type="checkbox"
                      name="scanlines"
                      checked={editedItem.scanlines || false}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Escaneo</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors border border-white/5">
                    <input
                      type="checkbox"
                      name="terminalScan"
                      checked={editedItem.terminalScan || false}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Barrido Terminal</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors border border-white/5">
                    <input
                      type="checkbox"
                      name="shake"
                      checked={editedItem.shake || false}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Sacudida</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors border border-white/5">
                    <input
                      type="checkbox"
                      name="pulse"
                      checked={editedItem.pulse || false}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Pulso</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors border border-white/5">
                    <input
                      type="checkbox"
                      name="blur"
                      checked={editedItem.blur || false}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Desenfoque</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors border border-white/5">
                    <input
                      type="checkbox"
                      name="staticNoise"
                      checked={editedItem.staticNoise || false}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Estática</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors border border-white/5">
                    <input
                      type="checkbox"
                      name="typewriter"
                      checked={editedItem.typewriter || false}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Máquina de Escribir</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors border border-white/5">
                    <input
                      type="checkbox"
                      name="breathing"
                      checked={editedItem.breathing || false}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <span className="text-lg">Respiración</span>
                  </label>
                </div>
              </div>
            </div>
          ) : activeTab === 'anim' ? (
            <div className="flex flex-col gap-6 p-4 pixel-panel bg-black/40 border-2 border-violet-500/30 animate-in fade-in zoom-in-95 duration-300 min-h-[450px]">
              {/* FILMSTRIP / TIMELINE */}
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs uppercase opacity-70 font-mono">Secuencia de Cuadros (Frames)</label>
                  <button 
                    onClick={() => {
                      const currentFilters = editedItem.animationHueFilters || [editedItem.boxFilter || 'none', editedItem.secondaryBoxFilter || 'none'];
                      const newFilters = [...currentFilters, currentFilters[currentFilters.length - 1]];
                      setEditedItem(prev => ({ 
                        ...prev, 
                        animationHueFilters: newFilters, 
                        secondaryBoxFilter: undefined,
                        blinkInterval: prev.blinkInterval || 500 // Asegurar que el motor rítmico se active
                      }));
                      setSelectedFrameIndex(newFilters.length - 1);
                    }}
                    className="pixel-button px-3 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-500"
                  >
                    + Añadir Frame
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-4 p-3 bg-black/30 rounded-lg border border-white/5 overflow-y-auto max-h-[280px] min-h-[100px] justify-start content-start">
                  {(editedItem.animationHueFilters || [editedItem.boxFilter || 'none', editedItem.secondaryBoxFilter || 'none']).map((filter, idx) => {
                    const isSequence = !!editedItem.animationHueFilters;
                    const isSecondary = !isSequence && idx === 1 && editedItem.secondaryBoxFilter;
                    const isActive = selectedFrameIndex === idx;
                    
                    return (
                      <div key={`frame-${idx}`} className="relative group shrink-0">
                        <button
                          onClick={() => setSelectedFrameIndex(idx)}
                          className={`w-16 h-10 relative pixel-panel border-2 transition-all ${isActive ? 'border-cyan-400 scale-110 z-10' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                        >
                          <div className="absolute inset-0" style={{
                            borderStyle: 'solid',
                            borderWidth: '4px 6px 5px 6px',
                            borderImage: `url("${editedItem.imageUrl}") 4 6 5 6 fill stretch`,
                            filter: filter,
                            imageRendering: 'pixelated'
                          }} />
                          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-mono opacity-50">{idx + 1}</span>
                        </button>
                        
                        {(editedItem.animationHueFilters?.length || 0) > 1 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const newFilters = [...(editedItem.animationHueFilters || [])];
                              newFilters.splice(idx, 1);
                              setEditedItem(prev => ({ ...prev, animationHueFilters: newFilters }));
                              if (selectedFrameIndex >= newFilters.length) setSelectedFrameIndex(newFilters.length - 1);
                            }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] border border-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COLOR SELECTOR FOR ACTIVE FRAME */}
              <div className="flex flex-col gap-2 animate-in slide-in-from-left-2 transition-all duration-300">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs uppercase opacity-70 font-mono text-cyan-400">Color del Frame {selectedFrameIndex + 1}</label>
                </div>
                <div className="flex flex-wrap gap-2 justify-center py-3 bg-black/30 rounded-lg border border-white/5">
                  {BOX_PALETTE_CONFIG.map((opt, idx) => (
                    <button
                      key={`anim-sequence-hue-${opt.hex}-${idx}`}
                      onClick={() => {
                        const currentFilters = editedItem.animationHueFilters || [editedItem.boxFilter || 'none', editedItem.secondaryBoxFilter || 'none'];
                        const newFilters = [...currentFilters];
                        newFilters[selectedFrameIndex] = opt.filter;
                        
                        // Si era el sistema viejo de 2, lo migramos al nuevo
                        if (!editedItem.animationHueFilters) {
                          setEditedItem(prev => ({ 
                            ...prev, 
                            animationHueFilters: newFilters,
                            boxFilter: newFilters[0],
                            secondaryBoxFilter: undefined // Desactivar el sistema viejo
                          }));
                        } else {
                          // Si el frame editado es el 0, también actualizamos el boxFilter principal
                          const update: any = { animationHueFilters: newFilters };
                          if (selectedFrameIndex === 0) update.boxFilter = opt.filter;
                          setEditedItem(prev => ({ ...prev, ...update }));
                        }
                      }}
                      className={`w-9 h-9 pixel-panel border-2 transition-all ${(editedItem.animationHueFilters || [editedItem.boxFilter || 'none', editedItem.secondaryBoxFilter || 'none'])[selectedFrameIndex] === opt.filter ? 'border-cyan-400 scale-110' : 'border-white/10 opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: opt.hex }}
                      title={opt.hex}
                    />
                  ))}
                </div>
                      {/* METRONOME */}
              <div className="flex flex-col gap-3 pt-2 mt-auto">
                 <div className="flex justify-between items-baseline">
                    <label className="text-xs uppercase text-violet-300 font-bold">Velocidad de Animación (BPM)</label>
                    <span className="text-xl font-mono text-white tracking-widest">{bpm} <span className="text-[10px] opacity-50">BPM</span></span>
                 </div>
                 <input
                   type="range"
                   min="30"
                   max="480"
                   step="1"
                   value={bpm}
                   onChange={(e) => handleBpmChange({ target: { value: e.target.value } } as any)}
                   className="w-full h-2 bg-violet-900/50 rounded-full appearance-none cursor-pointer accent-violet-400"
                 />
                 <p className="text-[10px] opacity-40 uppercase italic">Sincronizado globalmente con el metrónomo de la pizarra</p>
              </div>        </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <label className="text-lg flex-shrink-0">Enviar a:</label>
                <select
                  className="pixel-input text-lg flex-grow"
                  value={activeBoardIndex}
                  onChange={(e) => onSendToBoard(editedItem.id, Number(e.target.value))}
                >
                  {Array.from({ length: boardsLength }).map((_, i) => (
                    <option key={i} value={i} disabled={i === activeBoardIndex}>
                      Pizarra {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400 italic">Ajusta la posición del texto usando los botones sobre el elemento en la pizarra.</p>
            </div>
          )}
        </div>

        {/* Right Column: Controls */}
        <div className="w-px bg-[var(--pixel-border-color)] hidden md:block"></div>
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-w-0">
          {editedItem.type === ItemType.File && (
            <div className="flex flex-col gap-3 p-2 pixel-panel bg-black/30 mb-1">
              <label className="text-sm uppercase opacity-70">Adjuntar Archivo</label>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="pixel-input text-sm w-full"
                  accept=".java,.csj,.html,.txt,.js,.ts,.css,.json"
                />
                {editedItem.fileName && (
                  <div className="text-xs text-green-400">
                    Archivo actual: {editedItem.fileName}
                  </div>
                )}
              </div>
            </div>
          )}
          {editedItem.type === ItemType.Timer && (
            <div className="flex flex-col gap-3 p-2 pixel-panel bg-black/30 mb-1">
              <div className="flex flex-col gap-1">
                <label className="text-sm uppercase opacity-70">Modo del Temporizador</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditedItem(prev => ({ ...prev, timerMode: 'chrono', text: '00:00', timerValue: 0 }))}
                    className={`pixel-button flex-1 py-2 text-sm ${editedItem.timerMode === 'chrono' ? 'pixel-button-active' : ''}`}
                  >
                    Cronómetro
                  </button>
                  <button
                    onClick={() => setEditedItem(prev => ({ ...prev, timerMode: 'timer', text: formatTime(prev.timerInitialValue || 0), timerValue: prev.timerInitialValue || 0 }))}
                    className={`pixel-button flex-1 py-2 text-sm ${editedItem.timerMode === 'timer' ? 'pixel-button-active' : ''}`}
                  >
                    Temporizador
                  </button>
                </div>
              </div>
              {editedItem.timerMode === 'timer' && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm uppercase opacity-70">Valor Inicial (Segundos)</label>
                  <input
                    type="number"
                    name="timerInitialValue"
                    value={editedItem.timerInitialValue ?? 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditedItem(prev => ({
                        ...prev,
                        timerInitialValue: val,
                        timerValue: val,
                        text: formatTime(val)
                      }));
                    }}
                    className="pixel-input text-2xl w-full"
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          )}
          {editedItem.type === ItemType.Counter ? (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-sm uppercase opacity-70">Valor del Contador</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigator.clipboard.writeText(String(editedItem.counterValue ?? 0))}
                    className="pixel-button p-1 text-xs flex items-center gap-1 bg-amber-600 hover:bg-amber-500"
                    title="Copiar al portapapeles"
                  >
                    <CopyIcon />
                  </button>
                  <button
                    onClick={() => handlePaste('counterValue')}
                    className="pixel-button p-1 text-xs flex items-center gap-1 bg-purple-600 hover:bg-purple-500"
                    title="Pegar desde el portapapeles"
                  >
                    <PasteIcon />
                  </button>
                </div>
              </div>
              <input
                type="number"
                name="counterValue"
                value={editedItem.counterValue ?? 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEditedItem(prev => ({ ...prev, counterValue: val, text: String(val) }));
                }}
                className="pixel-input text-2xl w-full"
                placeholder="0"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-sm uppercase opacity-70">Texto y Fragmentos</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigator.clipboard.writeText(editedItem.text)}
                    className="pixel-button p-1 text-xs flex items-center gap-1 bg-amber-600 hover:bg-amber-500"
                    title="Copiar al portapapeles"
                  >
                    <CopyIcon />
                  </button>
                  <button
                    onClick={() => handlePaste('text')}
                    className="pixel-button p-1 text-xs flex items-center gap-1 bg-purple-600 hover:bg-purple-500"
                    title="Pegar desde el portapapeles"
                  >
                    <PasteIcon />
                  </button>
                  <button
                    onClick={handleAddFragment}
                    className="pixel-button p-1 text-xs flex items-center gap-1 bg-blue-600 hover:bg-blue-500"
                    title="Añadir fragmento de color"
                  >
                    <PlusIcon /> Color
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-black/40 p-1 mb-1 rounded border border-white/5 mt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold px-2">
                  <input type="checkbox" name="textShadow" checked={editedItem.textShadow ?? true} onChange={handleInputChange} className="w-4 h-4" />
                  <span className="text-xs">ACTIVAR SOMBRA</span>
                </label>
              </div>

              {editedItem.textFragments && editedItem.textFragments.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto p-1 pixel-panel bg-black/20">
                  {editedItem.textFragments.map((frag, i) => (
                    <div 
                      key={i} 
                      className={`flex gap-2 items-start bg-black/30 p-2 rounded border ${focusedFragmentIndex === i ? 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'border-white/5'} transition-all`}
                      onClick={() => setFocusedFragmentIndex(i)}
                    >
                      <div className="flex flex-col gap-2 flex-1">
                        <textarea
                          value={frag.text}
                          onChange={(e) => handleFragmentChange(i, 'text', e.target.value)}
                          className="pixel-input text-sm w-full h-12 resize-none"
                          placeholder="Texto del fragmento..."
                        />
                        <div className="flex items-center gap-4">
                          <label className="text-xs uppercase opacity-70 w-12 text-right">Texto:</label>
                          <input
                            type="color"
                            value={frag.color || editedItem.textColor || '#000000'}
                            onChange={(e) => handleFragmentChange(i, 'color', e.target.value)}
                            className="w-6 h-6 cursor-pointer"
                          />
                          <div className="flex flex-wrap gap-1">
                            {BASIC_COLORS.map(color => (
                              <button
                                key={`frag-color-${i}-${color}`}
                                type="button"
                                onClick={() => handleFragmentChange(i, 'color', color)}
                                className={`w-5 h-5 border transition-transform ${frag.color === color ? 'border-white scale-110 shadow-sm' : 'border-white/10 hover:scale-105'}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        {(editedItem.textShadow ?? true) && (
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={frag.hasShadow ?? editedItem.textShadow ?? true}
                                onChange={(e) => handleFragmentChange(i, 'hasShadow', e.target.checked)}
                                className="w-3 h-3"
                              />
                              <span className="text-xs uppercase opacity-70 w-12 text-right">Sombra:</span>
                            </label>
                            <input
                              type="color"
                              value={frag.shadowColor || editedItem.textShadowColor || '#FFFFFF'}
                              onChange={(e) => handleFragmentChange(i, 'shadowColor', e.target.value)}
                              className="w-6 h-6 cursor-pointer"
                            />
                            <div className="flex flex-wrap gap-1">
                              {BASIC_COLORS.map(color => (
                                <button
                                  key={`frag-shadow-${i}-${color}`}
                                  type="button"
                                  onClick={() => handleFragmentChange(i, 'shadowColor', color)}
                                  className={`w-5 h-5 border transition-transform ${frag.shadowColor === color ? 'border-white scale-110 shadow-sm' : 'border-white/10 hover:scale-105'}`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFragment(i)}
                        className="pixel-button p-1 bg-red-700 hover:bg-red-600 self-center"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2 bg-black/20 p-2 rounded border border-white/5">
                  <textarea
                    name="text"
                    value={editedItem.text}
                    onChange={handleInputChange}
                    className="pixel-input text-lg w-full h-20 resize-y"
                    placeholder="Escribe tu texto aquí..."
                  />
                  <div className="flex items-center gap-4 mt-1">
                    <label className="text-xs uppercase opacity-70 w-12 text-right">Texto:</label>
                    <input
                      type="color"
                      name="textColor"
                      value={editedItem.textColor || '#000000'}
                      onChange={handleInputChange}
                      className="w-6 h-6 cursor-pointer"
                    />
                    <div className="flex flex-wrap gap-1">
                      {BASIC_COLORS.map(color => (
                        <button
                          key={`main-color-${color}`}
                          type="button"
                          onClick={() => handleColorPaletteClick('textColor', color)}
                          className={`w-5 h-5 border transition-transform ${editedItem.textColor === color ? 'border-white scale-110 shadow-sm' : 'border-white/10 hover:scale-105'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  {(editedItem.textShadow ?? true) && (
                    <div className="flex items-center gap-4">
                      <label className="text-xs uppercase opacity-70 w-12 text-right">Sombra:</label>
                      <input
                        type="color"
                        name="textShadowColor"
                        value={editedItem.textShadowColor || '#FFFFFF'}
                        onChange={handleInputChange}
                        className="w-6 h-6 cursor-pointer"
                      />
                      <div className="flex flex-wrap gap-1">
                        {BASIC_COLORS.map(color => (
                          <button
                            key={`main-shadow-${color}`}
                            type="button"
                            onClick={() => handleColorPaletteClick('textShadowColor', color)}
                            className={`w-5 h-5 border transition-transform ${editedItem.textShadowColor === color ? 'border-white scale-110 shadow-sm' : 'border-white/10 hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm uppercase opacity-70">Fuente</label>
              <CustomSelect options={fontOptions} value={editedItem.fontFamily || FONT_FACES[1]} onChange={(val) => handleSelectChange('fontFamily', val)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm uppercase opacity-70">Tamaño</label>
              <input type="number" name="fontSize" value={editedItem.fontSize || 24} onChange={handleInputChange} className="pixel-input text-lg" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm uppercase opacity-70">Ancho (px)</label>
              <input
                type="number"
                value={Math.round(editedItem.width)}
                onChange={(e) => setEditedItem(prev => ({ ...prev, width: Math.max(10, Number(e.target.value)) }))}
                className="pixel-input text-lg"
                min="10"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm uppercase opacity-70">Alto (px)</label>
              <input
                type="number"
                value={Math.round(editedItem.height)}
                onChange={(e) => setEditedItem(prev => ({ ...prev, height: Math.max(10, Number(e.target.value)) }))}
                className="pixel-input text-lg"
                min="10"
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm uppercase opacity-70">Alineación y Formato</label>
              <div className="flex gap-2 items-center">
                <div className="flex gap-1 flex-1">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => handleSelectChange('textAlign', align)}
                      className={`pixel-button flex-1 py-1 text-xs ${editedItem.textAlign === align || (!editedItem.textAlign && align === 'center') ? 'pixel-button-active' : ''}`}
                    >
                      {align === 'left' ? 'Izq' : align === 'right' ? 'Der' : 'Cen'}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer pixel-panel px-2 py-1 bg-black/20">
                  <input
                    type="checkbox"
                    checked={editedItem.textTransform === 'uppercase'}
                    onChange={(e) => handleSelectChange('textTransform', e.target.checked ? 'uppercase' : 'none')}
                    className="w-4 h-4"
                  />
                  <span className="text-[10px] font-bold">ABC</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr className="pixel-divider" />
      <div className="flex justify-center items-center gap-4 px-4 pb-4">
        <button onClick={onClose} className="pixel-button px-6 py-2 flex items-center gap-2 text-2xl bg-red-700 hover:bg-red-600">
          Cancelar
        </button>
        <button onClick={handleSave} className="pixel-button px-6 py-2 flex items-center gap-2 text-2xl bg-green-700 hover:bg-green-600">
          Guardar
        </button>
      </div>
    </Modal>
  );
};

export default TextEditModal;