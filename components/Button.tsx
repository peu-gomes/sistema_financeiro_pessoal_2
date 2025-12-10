'use client';

import React from 'react';
import { BUTTON_STYLES, BUTTON_SIZES, TRANSITIONS } from '@/lib/designSystem';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  title?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  className = '',
  title,
}: ButtonProps) {
  const baseClasses = `${BUTTON_STYLES[variant]} ${BUTTON_SIZES[size]} ${TRANSITIONS.fast} font-medium rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${fullWidth ? 'w-full' : ''} ${className}`}
      title={title}
    >
      {children}
    </button>
  );
}
