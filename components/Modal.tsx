import React from 'react';

interface ModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, title, children, className = "max-w-2xl", icon, footer }) => {
  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[var(--z-modal)] p-4"
      onClick={onClose}
    >
      <div
        className={`pixel-panel w-full ${className} text-white relative flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b-4 border-[var(--pixel-border-color)] pb-3 mb-3">
          <div className="flex items-center gap-3 overflow-hidden">
            {icon}
            <h2 className="modal-title truncate">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="pixel-button w-10 h-10 flex items-center justify-center text-2xl bg-red-700 hover:bg-red-600"
          >
            X
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>
        {footer && (
          <div className="border-t-4 border-[var(--pixel-border-color)] pt-3 mt-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
