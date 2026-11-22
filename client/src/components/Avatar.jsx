import React, { useState } from 'react';

export default function Avatar({ src, name = '', size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);

  // Derive initials from first and last name
  const getInitials = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return '—';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '—';
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs font-black',
    lg: 'w-12 h-12 text-sm font-black',
    xl: 'w-16 h-16 text-lg font-black',
    '2xl': 'w-20 h-20 text-2xl font-black'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImageError(true)}
        className={`${currentSizeClass} rounded-full object-cover border border-[#C2B4A3] shrink-0 shadow-xs ${className}`}
      />
    );
  }

  return (
    <div
      title={name}
      className={`${currentSizeClass} rounded-full bg-[#1C1A18] text-[#F7F3EE] border border-[#C2B4A3] flex items-center justify-center shrink-0 tracking-wider select-none shadow-xs font-black ${className}`}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
}
