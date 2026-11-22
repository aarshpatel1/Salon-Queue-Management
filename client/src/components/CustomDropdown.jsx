import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';

export default function CustomDropdown({
  options = [],
  value,
  onChange,
  label = '',
  placeholder = 'Select an option',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
    placement: 'bottom',
    maxHeight: 220
  });

  const selectedOption = options.find((opt) => opt.value === value);

  // Compute precise viewport coordinates and auto-flip placement synchronously
  const computePosition = useCallback(() => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 220;
    const gap = 6;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const openAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    const width = Math.max(rect.width, 160);
    let left = rect.left;
    if (left + width > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - width - 8);
    }
    if (left < 8) left = 8;

    let top = 0;
    let maxHeight = 220;

    if (openAbove) {
      maxHeight = Math.max(100, Math.min(dropdownHeight, spaceAbove - gap - 8));
      top = rect.top - gap;
    } else {
      maxHeight = Math.max(100, Math.min(dropdownHeight, spaceBelow - gap - 8));
      top = rect.bottom + gap;
    }

    return {
      top,
      left,
      width,
      placement: openAbove ? 'top' : 'bottom',
      maxHeight
    };
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      // Synchronously compute position BEFORE opening so it never mounts at (0, 0)
      const nextCoords = computePosition();
      if (nextCoords) {
        setCoords(nextCoords);
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Re-sync position on window scroll or resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      const updated = computePosition();
      if (updated) {
        setCoords(updated);
      }
    };

    const handleOutsideClick = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, computePosition]);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-[10px] font-black text-[#4A4540] mb-1.5 uppercase tracking-wider pl-1">
          {label}
        </label>
      )}

      {/* Pill Button Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#FFFFFF] border border-[#E4DBD0] rounded-full text-xs font-bold text-[#1C1A18] hover:border-[#C2B4A3] transition-all cursor-pointer text-left shadow-xs active:scale-98"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon
          icon={isOpen ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'}
          className="w-4 h-4 text-[#4A4540] shrink-0 ml-2 transition-transform duration-200"
        />
      </button>

      {/* Overlay Dropdown Menu rendered via Portal into document.body */}
      {isOpen &&
        coords.width > 0 &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              transform: coords.placement === 'top' ? 'translateY(-100%)' : 'none',
              transformOrigin: coords.placement === 'top' ? 'bottom center' : 'top center',
              maxHeight: `${coords.maxHeight}px`,
              zIndex: 9999
            }}
            role="listbox"
            className="bg-[#FFFFFF] border border-[#E4DBD0] rounded-[24px] shadow-2xl p-1.5 overflow-y-auto scrollbar-thin space-y-1 animate-in fade-in zoom-in-95 duration-150 ease-out"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs rounded-full transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#1C1A18] text-[#F7F3EE] font-bold shadow-xs'
                      : 'text-[#1C1A18] hover:bg-[#F7F3EE]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Icon
                      icon="solar:check-circle-bold"
                      className="w-4 h-4 text-[#C2B4A3] shrink-0 ml-2"
                    />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
