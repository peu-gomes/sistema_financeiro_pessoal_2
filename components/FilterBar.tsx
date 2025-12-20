'use client';

import React from 'react';
import { Card } from '@/components/Card';

type FilterBarProps = {
  compact: boolean;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  showSecondary?: boolean;
  className?: string;
  topClassName?: string;
};

export default function FilterBar({
  compact,
  primary,
  secondary,
  showSecondary = true,
  className = '',
  topClassName = 'top-12',
}: FilterBarProps) {
  return (
    <Card
      variant="elevated"
      className={`mb-6 sticky ${topClassName} z-30 ${compact ? 'shadow-md' : ''} ${compact ? 'p-3' : 'p-4'} ${className}`}
    >
      <div className="space-y-3">
        <div>{primary}</div>
        {secondary && showSecondary && !compact && (
          <div className="pt-3 border-t border-gray-200">{secondary}</div>
        )}
      </div>
    </Card>
  );
}
