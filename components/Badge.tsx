'use client';

import React from 'react';
import { BADGE_STYLES } from '@/lib/designSystem';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'gray';
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({ children, variant = 'primary', icon, className = '' }: BadgeProps) {
  return (
    <span className={`${BADGE_STYLES[variant]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}
