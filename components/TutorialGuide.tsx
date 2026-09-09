import React, { useState, useEffect, useLayoutEffect } from 'react';

interface TutorialStep {
  elementId?: string;
  title: string;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '¡Bienvenido a Pixel Board!',
    text: 'Esta es una guía rápida adaptada a la última versión. ¡Vamos a descubrir qué puedes hacer!',
    position: 'bottom',
  },
  {
    elementId: 'tutorial-add-btn',
    title: 'Añadir Elementos',
    text: 'Desde aquí puedes añadir todo tipo de objetos: desde Cajas y Marcos hasta Ilustraciones, Sprites y herramientas como Contadores o Checkboxes.',
    position: 'right',
  },
  {
    elementId: 'tutorial-add-btn',
    title: 'Cajas y Marcos',
    text: 'Usa la "Caja" para crear áreas de texto con bordes que no se deforman, o un "Marco" para delimitar zonas de tu pizarra. Son los elementos base para organizar tu contenido.',
    position: 'right',
  },
  {
    elementId: 'tutorial-add-btn',
    title: 'Ilustraciones y Sprites',
    text: 'Elige una "Ilustración" de la colección pixel-art o un "Sprite" animado para decorar tu pizarra con imágenes ya listas.',
    position: 'right',
  },
  {
    elementId: 'tutorial-add-btn',
    title: 'Herramientas Útiles',
    text: 'También tienes Contadores para tus puntos, Temporizadores para tus retos, Archivos para guardar notas, Checkboxes para listas de tareas y Texto Plano cuando no necesitas bordes.',
    position: 'right',
  },
  {
    elementId: 'tutorial-music-btn',
    title: 'Sección Musical',
    text: '¡Exclusivo de esta versión! Añade acordes, escalas y armonizaciones completas a tu pizarra con un solo click.',
    position: 'right',
  },
  {
    elementId: 'tutorial-edit-btn',
    title: 'Menú de Edición',
    text: 'Aquí puedes gestionar las Capas para organizar qué va encima de qué, o usar el Inventario para guardar objetos.',
    position: 'right',
  },
  {
    elementId: 'tutorial-view-btn',
    title: 'Personalización Visual',
    text: 'Cambia el fondo de la pizarra, activa la cuadrícula para alinear objetos, prueba los diferentes Temas visuales, o pasa a Modo Móvil si estás en una pantalla chica.',
    position: 'right',
  },
  {
    elementId: 'tutorial-export-btn',
    title: 'Guardar y Exportar',
    text: 'Captura tu pizarra como imagen o guárdala en un archivo ".anticloud" (disquete) para no perder nada.',
    position: 'right',
  },
  {
    elementId: 'tutorial-boards-btn',
    title: 'Gestión de Pizarras',
    text: 'Navega entre tus diferentes pizarras o crea una nueva. Cada una tiene su propia configuración.',
    position: 'top',
  },
  {
    elementId: 'tutorial-viewport',
    title: 'Navegación Táctil',
    text: 'Arrastra el fondo para moverte por la pizarra y usa la rueda del ratón (o pellizca) para hacer zoom.',
    position: 'bottom',
  },
  {
    title: '¡Todo listo!',
    text: 'Ya conoces las herramientas actuales. ¡Es hora de darle vida a tu pizarra!',
    position: 'bottom',
  }
];

interface TutorialGuideProps {
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

const TutorialGuide: React.FC<TutorialGuideProps> = ({ step, onNext, onPrev, onSkip }) => {
  const [highlighterStyle, setHighlighterStyle] = useState<React.CSSProperties>({});
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const currentStep = TUTORIAL_STEPS[step];

  useLayoutEffect(() => {
    if (!currentStep) return;

    const isCenteredStep = !currentStep.elementId || currentStep.elementId === 'tutorial-viewport';
    const targetElement = isCenteredStep ? null : document.getElementById(currentStep.elementId);

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const PADDING = 8;
      
      setHighlighterStyle({
        top: `${rect.top - PADDING}px`,
        left: `${rect.left - PADDING}px`,
        width: `${rect.width + PADDING * 2}px`,
        height: `${rect.height + PADDING * 2}px`,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
        borderRadius: '4px',
        position: 'fixed',
        transition: 'all 0.3s ease-in-out',
        zIndex: 1000,
        pointerEvents: 'none',
      });

      const popoverPos: React.CSSProperties = { position: 'fixed', zIndex: 1001 };
      let position = currentStep.position || 'bottom';
      
      const POPOVER_WIDTH = 384; // w-96
      const POPOVER_ESTIMATED_HEIGHT = 180;
      const SCREEN_PADDING = 16;
      const { innerWidth, innerHeight } = window;

      // Automatically adjust position to fit on screen
      switch (position) {
          case 'top':
              if (rect.top - POPOVER_ESTIMATED_HEIGHT < SCREEN_PADDING) position = 'bottom';
              break;
          case 'bottom':
              if (rect.bottom + POPOVER_ESTIMATED_HEIGHT > innerHeight - SCREEN_PADDING) position = 'top';
              break;
          case 'right':
              if (rect.right + POPOVER_WIDTH > innerWidth - SCREEN_PADDING) position = 'left';
              break;
          case 'left':
              if (rect.left - POPOVER_WIDTH < SCREEN_PADDING) position = 'right';
              break;
      }
      
      const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

      if (position === 'bottom') {
        popoverPos.top = `${rect.bottom + PADDING + 5}px`;
        popoverPos.left = `${clamp(rect.left + rect.width / 2, SCREEN_PADDING + POPOVER_WIDTH / 2, innerWidth - SCREEN_PADDING - POPOVER_WIDTH / 2)}px`;
        popoverPos.transform = 'translateX(-50%)';
      } else if (position === 'top') {
        popoverPos.top = `${rect.top - PADDING - 5}px`;
        popoverPos.left = `${clamp(rect.left + rect.width / 2, SCREEN_PADDING + POPOVER_WIDTH / 2, innerWidth - SCREEN_PADDING - POPOVER_WIDTH / 2)}px`;
        popoverPos.transform = 'translate(-50%, -100%)';
      } else if (position === 'right') {
        popoverPos.top = `${clamp(rect.top, SCREEN_PADDING, innerHeight - SCREEN_PADDING - POPOVER_ESTIMATED_HEIGHT)}px`;
        popoverPos.left = `${rect.right + PADDING + 5}px`;
      } else if (position === 'left') {
        popoverPos.top = `${clamp(rect.top, SCREEN_PADDING, innerHeight - SCREEN_PADDING - POPOVER_ESTIMATED_HEIGHT)}px`;
        popoverPos.left = `${rect.left - PADDING - 5}px`;
        popoverPos.transform = 'translateX(-100%)';
      }
      setPopoverStyle(popoverPos);

    } else {
        setHighlighterStyle({
           position: 'fixed',
           inset: 0,
           boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
           zIndex: 1000,
        });
        setPopoverStyle({
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
        });
    }

  }, [step, currentStep]);

  if (!currentStep) return null;

  return (
    <>
      <div style={highlighterStyle} />
      <div style={popoverStyle} className="tutorial-popover pixel-panel w-96 max-w-sm">
        <div className="flex flex-col gap-3">
            <h3 className="text-2xl neon-text" style={{ textShadow: '2px 2px var(--pixel-border-color)' }}>{currentStep.title}</h3>
            <p className="text-lg">{currentStep.text}</p>
            <div className="flex justify-between items-center mt-2">
                <button onClick={onSkip} className="pixel-button px-3 py-1 text-lg bg-red-700 hover:bg-red-600">Saltar</button>
                <div className="flex items-center gap-2">
                    {step > 0 && <button onClick={onPrev} className="pixel-button px-3 py-1 text-lg">Anterior</button>}
                    <button onClick={onNext} className="pixel-button px-3 py-1 text-lg bg-green-700 hover:bg-green-600">
                        {step === TUTORIAL_STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}
                    </button>
                    <span className="text-lg ml-2">{step + 1} / {TUTORIAL_STEPS.length}</span>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default TutorialGuide;