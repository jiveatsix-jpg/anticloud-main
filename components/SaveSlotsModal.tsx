import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Board, SaveSlotMeta } from '../types';
import Modal from './Modal';
import { FileIcon } from './Icons';
import { deleteSlot, listSlots, loadSlot, saveSlot } from '../utils/slotStorage';
import { BOARD_FILE_EXTENSION, MAX_BOARD_NAME_LENGTH, downloadBoardFile, parseBoardFile } from '../utils/boardFileUtils';

interface SaveSlotsModalProps {
  board: Board;
  boardNumber: number;
  onClose: () => void;
  onImportBoard: (board: Board) => void;
}

const formatSavedAt = (savedAt: number) =>
  new Date(savedAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });

const formatItemCount = (count: number) => `${count} ${count === 1 ? 'elemento' : 'elementos'}`;

const SaveSlotsModal: React.FC<SaveSlotsModalProps> = ({ board, boardNumber, onClose, onImportBoard }) => {
  const defaultName = `Pizarra ${boardNumber}`;
  const [name, setName] = useState(defaultName);
  const [slots, setSlots] = useState<SaveSlotMeta[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [overwriteTarget, setOverwriteTarget] = useState<SaveSlotMeta | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trimmedName = name.trim();

  const refreshSlots = useCallback(async () => {
    try {
      setSlots(await listSlots());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer la lista de guardados.');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refreshSlots();
  }, [refreshSlots]);

  const run = async (action: () => Promise<void>) => {
    setIsBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSave = (existing?: SaveSlotMeta) => run(async () => {
    const meta = await saveSlot(trimmedName, board, existing?.id);
    setOverwriteTarget(null);
    setNotice(`Pizarra guardada como «${meta.name}».`);
    await refreshSlots();
  });

  const handleSaveClick = () => {
    if (!trimmedName || isBusy) return;
    const existing = slots.find(s => s.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      setOverwriteTarget(existing);
      return;
    }
    handleSave();
  };

  const handleLoad = (slot: SaveSlotMeta) => run(async () => {
    const loaded = await loadSlot(slot.id);
    if (!loaded) throw new Error('No se encontró el guardado. Puede que ya se haya borrado.');
    onImportBoard(loaded);
    onClose();
  });

  const handleDelete = (slot: SaveSlotMeta) => run(async () => {
    await deleteSlot(slot.id);
    setDeleteTargetId(null);
    await refreshSlots();
  });

  const handleExport = () => {
    setError(null);
    setNotice(null);
    try {
      downloadBoardFile(board, trimmedName || defaultName);
      setNotice('Se inició la descarga del archivo de pizarra.');
    } catch (e) {
      console.error('ANTI_CLOUD Error al exportar la pizarra:', e);
      setError('No se pudo exportar la pizarra.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    run(async () => {
      let text: string;
      try {
        text = await file.text();
      } catch (readError) {
        console.error('ANTI_CLOUD Error al leer el archivo de pizarra:', readError);
        throw new Error('No se pudo leer el archivo.');
      }
      onImportBoard(parseBoardFile(text).board);
      onClose();
    });
  };

  return (
    <Modal
      onClose={onClose}
      title="Guardados de Pizarra"
      className="max-w-xl"
      icon={<FileIcon />}
      footer={
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            disabled={isBusy}
            title="Descarga la pizarra actual como un archivo .anticloud-board que se puede compartir o respaldar."
            className="pixel-button flex-1 p-3 text-sm bg-emerald-600 hover:bg-emerald-500"
          >
            Exportar pizarra actual a archivo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            title="Añade como pizarra nueva el contenido de un archivo .anticloud-board. No reemplaza la pizarra actual."
            className="pixel-button flex-1 p-3 text-sm bg-indigo-600 hover:bg-indigo-500"
          >
            Importar pizarra desde archivo
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept={`${BOARD_FILE_EXTENSION},.json`}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="save-slot-name" className="text-sm text-white/70">Nombre del guardado</label>
          <div className="flex gap-2">
            <input
              id="save-slot-name"
              type="text"
              value={name}
              maxLength={MAX_BOARD_NAME_LENGTH}
              onChange={(e) => {
                setName(e.target.value);
                setOverwriteTarget(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveClick();
              }}
              className="pixel-input flex-1 min-w-0"
            />
            <button
              onClick={handleSaveClick}
              disabled={isBusy || !trimmedName}
              title="Guarda una copia de la pizarra actual en esta lista."
              className="pixel-button px-4 py-2 bg-green-700 hover:bg-green-600"
            >
              Guardar pizarra actual
            </button>
          </div>
          {overwriteTarget && (
            <div className="pixel-content-box flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-amber-300">
                Ya existe un guardado llamado «{overwriteTarget.name}». ¿Quieres sobrescribirlo?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setOverwriteTarget(null)}
                  disabled={isBusy}
                  className="pixel-button px-3 py-1 text-sm bg-white/10 hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSave(overwriteTarget)}
                  disabled={isBusy}
                  className="pixel-button px-3 py-1 text-sm bg-amber-700 hover:bg-amber-600"
                >
                  Sobrescribir
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        {notice && <p role="status" className="text-sm text-green-400">{notice}</p>}

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm text-white/70">Guardados</h3>
            <p className="text-[10px] text-white/50 font-mono">
              Cargar un guardado añade una pizarra nueva; no reemplaza la actual. Los guardados se almacenan localmente en tu navegador.
            </p>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            {isLoadingList ? (
              <p className="text-center py-8 text-white/50 font-mono italic">Cargando guardados...</p>
            ) : slots.length === 0 ? (
              <p className="text-center py-8 text-white/50 font-mono italic">
                Aún no hay guardados. Guarda tu pizarra actual para empezar.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {slots.map((slot) => (
                  <li key={slot.id} className="pixel-content-box flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate" title={slot.name}>{slot.name}</div>
                      <div className="text-[10px] text-white/50 font-mono">
                        {formatSavedAt(slot.savedAt)} · {formatItemCount(slot.itemCount)}
                      </div>
                    </div>
                    {deleteTargetId === slot.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-red-300">¿Borrar? No se puede deshacer.</span>
                        <button
                          onClick={() => setDeleteTargetId(null)}
                          disabled={isBusy}
                          className="pixel-button px-3 py-1 text-sm bg-white/10 hover:bg-white/20"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleDelete(slot)}
                          disabled={isBusy}
                          className="pixel-button px-3 py-1 text-sm bg-red-700 hover:bg-red-600"
                        >
                          Borrar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoad(slot)}
                          disabled={isBusy}
                          title="Añade este guardado como una pizarra nueva."
                          className="pixel-button px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-500"
                        >
                          Cargar
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(slot.id)}
                          disabled={isBusy}
                          title="Elimina este guardado de forma permanente."
                          className="pixel-button px-3 py-1 text-sm bg-red-700 hover:bg-red-600"
                        >
                          Borrar
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SaveSlotsModal;
