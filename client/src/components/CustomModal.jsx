import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';

export default function CustomModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  icon = null
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-transparent select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`bg-[#FFFFFF] text-[#1C1A18] rounded-[36px] w-full ${maxWidth} border border-[#E4DBD0] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Capsule Header */}
        <div className="px-6 py-4.5 border-b border-[#E4DBD0] bg-[#F7F3EE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-10 h-10 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shrink-0">
                <Icon icon={icon} className="w-5 h-5 text-[#C2B4A3]" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-black text-[#1C1A18] tracking-tight truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-[#4A4540] font-medium tracking-wide">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FFFFFF] border border-[#E4DBD0] text-[#1C1A18] hover:bg-[#E4DBD0] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}
