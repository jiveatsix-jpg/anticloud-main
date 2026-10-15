import React from 'react';
import { StorageNotice } from '../types';

interface StorageNoticeBannerProps {
  notice: StorageNotice;
  onDismiss: () => void;
}

const BLOCKED_MESSAGE =
  'No se pudieron leer tus pizarras guardadas. Para protegerlas, los cambios de esta sesión no se guardarán automáticamente. Reinicia la aplicación para volver a intentarlo.';

const MESSAGES: Record<StorageNotice['kind'], string> = {
  recovered:
    'Algunas pizarras guardadas no se pudieron leer por completo. Se guardó un respaldo: abre Exportar → Guardados de Pizarra para intentar restaurarlas.',
  'read-failed': BLOCKED_MESSAGE,
  'backup-failed': BLOCKED_MESSAGE,
};

const StorageNoticeBanner: React.FC<StorageNoticeBannerProps> = ({ notice, onDismiss }) => {
  const isBlocking = notice.kind !== 'recovered';
  return (
    <div
      role={isBlocking ? 'alert' : 'status'}
      className="fixed top-16 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl z-[var(--z-toolbar)] pixel-panel flex items-start gap-3 text-white"
    >
      <p className={`flex-1 text-sm ${isBlocking ? 'text-red-300' : 'text-amber-300'}`}>{MESSAGES[notice.kind]}</p>
      <button
        onClick={onDismiss}
        title="Cerrar aviso"
        aria-label="Cerrar aviso"
        className="pixel-button w-8 h-8 shrink-0 flex items-center justify-center bg-white/10 hover:bg-white/20"
      >
        X
      </button>
    </div>
  );
};

export default StorageNoticeBanner;
