import React from 'react';
import { ModalState } from '../hooks/useUIState';
import {
  PlusIcon, TitleIcon, TextboxIcon, PixelIcon, SpriteIcon, SparklesIcon,
  MusicIcon, LayersIcon, SettingsIcon, GridIcon, PaletteIcon, CameraIcon,
  CropIcon, FullscreenIcon, BoardPrevIcon, BoardNextIcon, SmartphoneIcon,
  SelectIcon, DuplicateIcon, DeleteIcon, CopyIcon, PasteIcon, HelpIcon,
  CounterIcon, TimerIcon, FileIcon, CheckboxIcon, TextIcon, SuggestionIcon, XIcon,
  ChevronDownIcon, FrameIcon
} from './Icons';

interface ToolbarProps {
  isMobileMode: boolean;
  activeCategory: string | null;
  handleCategoryEnter: (category: string) => void;
  handleCategoryLeave: () => void;
  setActiveCategory: (category: string | null) => void;
  setActiveModal: React.Dispatch<React.SetStateAction<ModalState>>;
  backgroundInputRef: React.RefObject<HTMLInputElement>;
  isGridVisible: boolean;
  setIsGridVisible: React.Dispatch<React.SetStateAction<boolean>>;
  handleThemeChange: () => void;
  showScreenshotOptions: boolean;
  setShowScreenshotOptions: React.Dispatch<React.SetStateAction<boolean>>;
  handleScreenshot: (area?: any) => void;
  setIsSelectingArea: React.Dispatch<React.SetStateAction<boolean>>;
  activeBoardIndex: number;
  boardsCount: number;
  setActiveBoardIndex: React.Dispatch<React.SetStateAction<number>>;
  handleAddBoard: () => void;
  handleRemoveBoard: (index: number) => void;
  isMultiSelectMode: boolean;
  setIsMultiSelectMode: React.Dispatch<React.SetStateAction<boolean>>;
  selectedItemIds: string[];
  handleDuplicateSelected: () => void;
  handleDeleteSelected: () => void;
  handleCopySelected: () => void;
  handlePaste: () => void;
  handleGroupItems: (ids: string[]) => void;
  handleUngroupItems: (ids: string[]) => void;
  handleAddCounter: () => void;
  handleAddTimer: () => void;
  handleAddFile: () => void;
  handleAddCheckbox: () => void;
  handleAddPlainText: () => void;
  handleAddBox: () => void;
  handleAddFrame: () => void;
  setIsMobileMode: React.Dispatch<React.SetStateAction<boolean>>;
  handleStartTutorial: () => void;
  handleExportToDisk: () => void;
  disketteInputRef: React.RefObject<HTMLInputElement>;
  infoModeOn: boolean;
  setInfoModeOn: React.Dispatch<React.SetStateAction<boolean>>;
}

const Toolbar: React.FC<ToolbarProps> = ({
  isMobileMode,
  activeCategory,
  handleCategoryEnter,
  handleCategoryLeave,
  setActiveCategory,
  setActiveModal,
  backgroundInputRef,
  isGridVisible,
  setIsGridVisible,
  handleThemeChange,
  handleScreenshot,
  setIsSelectingArea,
  activeBoardIndex,
  boardsCount,
  setActiveBoardIndex,
  handleAddBoard,
  handleRemoveBoard,
  isMultiSelectMode,
  setIsMultiSelectMode,
  selectedItemIds,
  handleDuplicateSelected,
  handleDeleteSelected,
  handleCopySelected,
  handlePaste,
  handleGroupItems,
  handleUngroupItems,
  handleAddCounter,
  handleAddTimer,
  handleAddFile,
  handleAddCheckbox,
  handleAddPlainText,
  handleAddBox,
  handleAddFrame,
  setIsMobileMode,
  handleStartTutorial,
  handleExportToDisk,
  disketteInputRef,
  infoModeOn,
  setInfoModeOn
}) => {
  const toggleCategory = (category: string) => {
    setActiveCategory(activeCategory === category ? null : category);
  };

  const MenuItem = ({ icon, label, onClick, color = "bg-slate-700", title }: { icon: React.ReactNode, label: string, onClick: () => void, color?: string, title?: string }) => (
    <button
      onClick={() => {
        onClick();
        setActiveCategory(null);
      }}
      title={title}
      className={`flex items-center gap-3 w-full p-2 hover:bg-white/10 transition-colors text-left font-mono text-sm`}
    >
      <div className={`p-1.5 rounded-sm ${color} scale-75`}>
        {icon}
      </div>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <>
      {activeCategory && (
        <div
          className="fixed inset-0 z-[999] bg-transparent"
          onClick={() => setActiveCategory(null)}
        />
      )}
      <div className="fixed top-0 left-0 right-0 h-12 bg-black/40 backdrop-blur-md border-b-4 border-slate-800 flex items-center px-4 gap-2 z-[1000]">
        {/* Pizarra */}
        <div className="relative h-full flex items-center">
          <button
            id="tutorial-boards-btn"
            onClick={() => toggleCategory('boards')}
            title="Gestioná tus pizarras: crear una nueva, cambiar de una a otra, ajustes o eliminar."
            className={`px-3 h-full flex items-center gap-2 hover:bg-white/5 transition-colors font-mono text-sm ${activeCategory === 'boards' ? 'bg-white/10 text-indigo-400' : 'text-white'}`}
          >
            <BoardNextIcon />
            {!isMobileMode && <span>Pizarra</span>}
            <ChevronDownIcon />
          </button>
          {activeCategory === 'boards' && (
            <div className="absolute top-full left-0 mt-1 pixel-panel min-w-[200px] flex flex-col p-1 bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between p-2 border-b-2 border-slate-800 mb-1">
                <button
                  onClick={() => setActiveBoardIndex(prev => Math.max(0, prev - 1))}
                  disabled={activeBoardIndex === 0}
                  title="Va a la pizarra anterior."
                  className="pixel-button p-1 bg-indigo-600 disabled:opacity-50"
                >
                  <BoardPrevIcon />
                </button>
                <span className="text-white font-mono text-xs">
                  {activeBoardIndex + 1} / {boardsCount}
                </span>
                <button
                  onClick={() => setActiveBoardIndex(prev => Math.min(boardsCount - 1, prev + 1))}
                  disabled={activeBoardIndex === boardsCount - 1}
                  title="Va a la pizarra siguiente."
                  className="pixel-button p-1 bg-indigo-600 disabled:opacity-50"
                >
                  <BoardNextIcon />
                </button>
              </div>
              <MenuItem icon={<PlusIcon />} label="Nueva Pizarra" onClick={handleAddBoard} color="bg-green-600" title="Crea una pizarra nueva y en blanco." />
              <MenuItem icon={<SettingsIcon />} label="Ajustes de Pizarra" onClick={() => setActiveModal('boardSettings')} color="bg-indigo-700" title="Abre la configuración de la pizarra actual." />
              {boardsCount > 1 && (
                <MenuItem icon={<DeleteIcon />} label="Eliminar Pizarra" onClick={() => handleRemoveBoard(activeBoardIndex)} color="bg-red-600" title="Elimina la pizarra actual. No se puede deshacer." />
              )}
            </div>
          )}
        </div>

        {/* Añadir */}
        <div className="relative h-full flex items-center">
          <button
            id="tutorial-add-btn"
            onClick={() => toggleCategory('add')}
            title="Agregá elementos nuevos al pizarrón: cajas, marcos, ilustraciones, sprites y más."
            className={`px-3 h-full flex items-center gap-2 hover:bg-white/5 transition-colors font-mono text-sm ${activeCategory === 'add' ? 'bg-white/10 text-blue-400' : 'text-white'}`}
          >
            <PlusIcon />
            {!isMobileMode && <span>Añadir</span>}
            <ChevronDownIcon />
          </button>
          {activeCategory === 'add' && (
            <div className="absolute top-full left-0 mt-1 pixel-panel min-w-[220px] flex flex-col p-1 bg-slate-900 shadow-2xl max-h-[70vh] overflow-y-auto">
              <MenuItem icon={<TextboxIcon />} label="Caja" onClick={handleAddBox} color="bg-violet-600" title="Agrega una caja de texto editable en blanco." />
              <MenuItem icon={<FrameIcon />} label="Marco" onClick={handleAddFrame} color="bg-orange-700" title="Agrega un marco decorativo para encuadrar otros elementos." />
              <div className="h-0.5 bg-slate-800 my-1" />
              <MenuItem icon={<PixelIcon />} label="Ilustración" onClick={() => setActiveModal('addPixel')} color="bg-yellow-500" title="Abre la galería para agregar una ilustración (imagen grande) al pizarrón." />
              <MenuItem icon={<SpriteIcon />} label="Sprite" onClick={() => setActiveModal('addSprite')} color="bg-green-600" title="Abre la galería para agregar un sprite (imagen pequeña) al pizarrón." />
              <div className="h-0.5 bg-slate-800 my-1" />
              <MenuItem icon={<CounterIcon />} label="Contador" onClick={handleAddCounter} color="bg-rose-600" title="Agrega un contador numérico que podés incrementar o decrementar." />
              <MenuItem icon={<TimerIcon />} label="Temporizador" onClick={handleAddTimer} color="bg-orange-600" title="Agrega un temporizador con cronómetro o cuenta regresiva." />
              <MenuItem icon={<FileIcon />} label="Archivo" onClick={handleAddFile} color="bg-slate-600" title="Agrega una nota de texto con formato de archivo." />
              <MenuItem icon={<CheckboxIcon />} label="Checkbox" onClick={handleAddCheckbox} color="bg-emerald-600" title="Agrega una casilla de verificación (tarea con tilde)." />
              <MenuItem icon={<TextIcon />} label="Texto Plano" onClick={handleAddPlainText} color="bg-zinc-600" title="Agrega texto simple, sin caja ni fondo." />
            </div>
          )}
        </div>

        {/* Música */}
        <div className="relative h-full flex items-center">
          <button
            id="tutorial-music-btn"
            onClick={() => toggleCategory('music')}
            title="Agregá acordes o una progresión armónica completa al pizarrón."
            className={`px-3 h-full flex items-center gap-2 hover:bg-white/5 transition-colors font-mono text-sm ${activeCategory === 'music' ? 'bg-white/10 text-indigo-400' : 'text-white'}`}
          >
            <MusicIcon />
            {!isMobileMode && <span>Música</span>}
            <ChevronDownIcon />
          </button>
          {activeCategory === 'music' && (
            <div className="absolute top-full left-0 mt-1 pixel-panel min-w-[200px] flex flex-col p-1 bg-slate-900 shadow-2xl">
              <MenuItem icon={<MusicIcon />} label="Añadir Acorde" onClick={() => setActiveModal('addChord')} color="bg-indigo-600" title="Abre el selector para agregar un acorde musical al pizarrón." />
              <MenuItem icon={<LayersIcon />} label="Armonización" onClick={() => setActiveModal('addHarmonization')} color="bg-blue-600" title="Abre el asistente para agregar una progresión de acordes completa." />
            </div>
          )}
        </div>

        {/* Edición */}
        <div className="relative h-full flex items-center">
          <button
            id="tutorial-edit-btn"
            onClick={() => toggleCategory('edit')}
            title="Herramientas de edición: selección múltiple, capas, inventario, duplicar, copiar/pegar, agrupar."
            className={`px-3 h-full flex items-center gap-2 hover:bg-white/5 transition-colors font-mono text-sm ${activeCategory === 'edit' ? 'bg-white/10 text-slate-400' : 'text-white'}`}
          >
            <SelectIcon />
            {!isMobileMode && <span>Edición</span>}
            <ChevronDownIcon />
          </button>
          {activeCategory === 'edit' && (
            <div className="absolute top-full left-0 mt-1 pixel-panel min-w-[200px] flex flex-col p-1 bg-slate-900 shadow-2xl">
              <MenuItem
                icon={<SelectIcon />}
                label={isMultiSelectMode ? "Desactivar Selección" : "Modo Selección"}
                onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                color={isMultiSelectMode ? "bg-red-600" : "bg-slate-700"}
                title={isMultiSelectMode ? "Vuelve al modo de selección normal (un elemento a la vez)." : "Activa la selección múltiple: click y arrastre para elegir varios elementos a la vez."}
              />
              <div className="h-0.5 bg-slate-800 my-1" />
              <MenuItem icon={<LayersIcon />} label="Capas" onClick={() => setActiveModal('layers')} color="bg-emerald-600" title="Abre el panel de capas para ordenar los elementos del pizarrón." />
              <MenuItem icon={<FileIcon />} label="Inventario" onClick={() => setActiveModal('inventory')} color="bg-amber-600" title="Abre el inventario de elementos guardados para reutilizar." />
              <div className="h-0.5 bg-slate-800 my-1" />
              <MenuItem icon={<DuplicateIcon />} label="Duplicar" onClick={handleDuplicateSelected} color="bg-blue-600" title="Duplica los elementos seleccionados." />
              <MenuItem icon={<DeleteIcon />} label="Eliminar" onClick={handleDeleteSelected} color="bg-red-600" title="Elimina los elementos seleccionados." />
              <MenuItem icon={<CopyIcon />} label="Copiar" onClick={handleCopySelected} color="bg-indigo-600" title="Copia los elementos seleccionados al portapapeles interno." />
              <MenuItem icon={<PasteIcon />} label="Pegar" onClick={handlePaste} color="bg-indigo-500" title="Pega los elementos copiados en el pizarrón." />
              <div className="h-0.5 bg-slate-800 my-1" />
              <MenuItem icon={<LayersIcon />} label="Agrupar" onClick={() => handleGroupItems(selectedItemIds)} color="bg-emerald-600" title="Agrupa los elementos seleccionados para moverlos juntos." />
              <MenuItem icon={<XIcon />} label="Desagrupar" onClick={() => handleUngroupItems(selectedItemIds)} color="bg-slate-600" title="Separa un grupo en sus elementos individuales." />
            </div>
          )}
        </div>

        {/* Vista */}
        <div className="relative h-full flex items-center">
          <button
            id="tutorial-view-btn"
            onClick={() => toggleCategory('view')}
            title="Ajustá cómo se ve la aplicación: fondo, cuadrícula, tema de color y modo móvil."
            className={`px-3 h-full flex items-center gap-2 hover:bg-white/5 transition-colors font-mono text-sm ${activeCategory === 'view' ? 'bg-white/10 text-teal-400' : 'text-white'}`}
          >
            <SettingsIcon />
            {!isMobileMode && <span>Vista</span>}
            <ChevronDownIcon />
          </button>
          {activeCategory === 'view' && (
            <div className="absolute top-full left-0 mt-1 pixel-panel min-w-[200px] flex flex-col p-1 bg-slate-900 shadow-2xl">
              <MenuItem icon={<SettingsIcon />} label="Cambiar Fondo" onClick={() => backgroundInputRef.current?.click()} color="bg-teal-600" title="Elegí una imagen para usar de fondo del pizarrón." />
              <MenuItem icon={<GridIcon />} label={isGridVisible ? "Ocultar Cuadrícula" : "Mostrar Cuadrícula"} onClick={() => setIsGridVisible(!isGridVisible)} color={isGridVisible ? "bg-slate-500" : "bg-slate-700"} title="Muestra u oculta la cuadrícula de referencia para alinear elementos." />
              <MenuItem icon={<PaletteIcon />} label="Cambiar Tema" onClick={handleThemeChange} color="bg-pink-600" title="Cambia la paleta de colores visual de la aplicación." />
              <MenuItem icon={<SmartphoneIcon />} label={isMobileMode ? "Modo Escritorio" : "Modo Móvil"} onClick={() => setIsMobileMode(!isMobileMode)} color={isMobileMode ? "bg-blue-600" : "bg-slate-700"} title={isMobileMode ? "Vuelve al diseño completo para escritorio." : "Cambia a un diseño compacto pensado para pantallas táctiles."} />
            </div>
          )}
        </div>

        {/* Exportar */}
        <div className="relative h-full flex items-center">
          <button
            id="tutorial-export-btn"
            onClick={() => toggleCategory('export')}
            title="Exportá el pizarrón como imagen, o guardá/cargá todos los datos de la app."
            className={`px-3 h-full flex items-center gap-2 hover:bg-white/5 transition-colors font-mono text-sm ${activeCategory === 'export' ? 'bg-white/10 text-orange-400' : 'text-white'}`}
          >
            <CameraIcon />
            {!isMobileMode && <span>Exportar</span>}
            <ChevronDownIcon />
          </button>
          {activeCategory === 'export' && (
            <div className="absolute top-full left-0 mt-1 pixel-panel min-w-[200px] flex flex-col p-1 bg-slate-900 shadow-2xl">
              <MenuItem icon={<FullscreenIcon />} label="Captura Completa" onClick={() => handleScreenshot()} color="bg-orange-600" title="Descarga una imagen PNG de todo el pizarrón." />
              <MenuItem icon={<CropIcon />} label="Seleccionar Área" onClick={() => setIsSelectingArea(true)} color="bg-amber-600" title="Elegí un área específica del pizarrón para exportar como imagen." />
              <div className="h-0.5 bg-slate-800 my-1" />
              <MenuItem icon={<FileIcon />} label="Guardar a Disquete" onClick={handleExportToDisk} color="bg-emerald-600" title="Descarga todos los datos de la app (pizarras, imágenes, ajustes) como un archivo .anticloud." />
              <MenuItem icon={<FileIcon />} label="Cargar de Disquete" onClick={() => disketteInputRef.current?.click()} color="bg-indigo-600" title="Carga datos guardados desde un archivo .anticloud, reemplazando el estado actual." />
            </div>
          )}
        </div>

        <div className="flex-grow" />

        {/* Ayuda */}
        <div className="relative h-full flex items-center">
          <button
            id="tutorial-help-btn"
            onClick={() => toggleCategory('help')}
            title="Tutorial guiado, Modo Info y espacio de sugerencias."
            className={`px-3 h-full flex items-center gap-2 hover:bg-white/5 transition-colors font-mono text-sm ${activeCategory === 'help' ? 'bg-white/10 text-amber-400' : 'text-white'}`}
          >
            <HelpIcon />
            {!isMobileMode && <span>Ayuda</span>}
            <ChevronDownIcon />
          </button>
          {activeCategory === 'help' && (
            <div className="absolute top-full right-0 mt-1 pixel-panel min-w-[200px] flex flex-col p-1 bg-slate-900 shadow-2xl">
              <MenuItem icon={<HelpIcon />} label="Ver Tutorial" onClick={handleStartTutorial} color="bg-slate-700" title="Vuelve a mostrar el tutorial guiado paso a paso de la aplicación." />
              <MenuItem
                icon={<SuggestionIcon />}
                label={infoModeOn ? 'Modo Info: activado' : 'Modo Info: desactivado'}
                onClick={() => setInfoModeOn(v => !v)}
                color={infoModeOn ? 'bg-amber-500' : 'bg-slate-700'}
                title="Mientras esté activo, al pasar el mouse por cualquier botón aparece un cuadro explicando qué hace."
              />
              <MenuItem icon={<SuggestionIcon />} label="Sugerencias / Notas" onClick={() => setActiveModal('suggestions')} color="bg-amber-600" title="Abre un espacio para dejar sugerencias o notas sobre la app." />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Toolbar;
