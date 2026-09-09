import React, { useEffect, useRef, useState } from 'react';

interface InfoContent {
  label: string;
  text: string;
}

function readInfo(el: Element): InfoContent | null {
  const text = el.getAttribute('title') || el.getAttribute('aria-label');
  if (!text) return null;
  const label = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40);
  return { label, text };
}

/**
 * Cuadro flotante que, cuando `active` es true, muestra el `title` o
 * `aria-label` del elemento bajo el cursor. Reutiliza los textos que ya
 * existen en toda la app en vez de duplicar contenido, así funciona sobre
 * cualquier control, incluidos los renderizados dentro de modales.
 */
export default function InfoTooltip({ active }: { active: boolean }) {
  const [info, setInfo] = useState<InfoContent | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const currentEl = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) {
      setInfo(null);
      currentEl.current = null;
      return;
    }

    const onMove = (e: MouseEvent) => {
      const target = (e.target as Element)?.closest('[title], [aria-label]');
      if (!target) {
        if (currentEl.current) { currentEl.current = null; setInfo(null); }
        return;
      }
      if (target !== currentEl.current) {
        currentEl.current = target;
        setInfo(readInfo(target));
      }
      setPos({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [active]);

  if (!active || !info) return null;

  const pad = 14;
  let left = pos.x + pad;
  let top = pos.y + pad;
  const rect = boxRef.current?.getBoundingClientRect();
  if (rect) {
    if (left + rect.width > window.innerWidth) left = pos.x - rect.width - pad;
    if (top + rect.height > window.innerHeight) top = pos.y - rect.height - pad;
  }

  return (
    <div
      ref={boxRef}
      className="fixed z-[999] max-w-[260px] p-2.5 bg-slate-900 border-2 border-cyan-400 text-white text-xs leading-relaxed pointer-events-none"
      style={{
        left: Math.max(4, left), top: Math.max(4, top),
        boxShadow: '4px 4px 0 rgba(0,0,0,.7)',
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      }}
    >
      {info.label && (
        <div className="font-bold text-red-500 border-b border-cyan-400/40 mb-1.5 pb-1">
          {info.label}
        </div>
      )}
      <div>{info.text}</div>
    </div>
  );
}
