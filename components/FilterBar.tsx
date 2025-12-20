'use client';

import React from 'react';
import { Card } from '@/components/Card';

type FilterBarProps = {
  compact: boolean;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  secondaryMini?: React.ReactNode;
  showSecondary?: boolean;
  className?: string;
  topClassName?: string;
};

export default function FilterBar({
  compact,
  primary,
  secondary,
  secondaryMini,
  showSecondary = true,
  className = '',
  topClassName = 'top-0 md:top-[65px]',
}: FilterBarProps) {
  const secondaryNode = compact ? secondaryMini : secondary;
  const showSecondaryNode = Boolean(secondaryNode) && showSecondary;

  return (
    <Card
      variant="elevated"
      className={`mb-6 sticky ${topClassName} z-30 ${compact ? 'shadow-md' : ''} ${compact ? 'p-2 md:p-3' : 'p-3 md:p-4'} ${className}`}
    >
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        <div>{primary}</div>
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            showSecondaryNode ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
          aria-hidden={!showSecondaryNode}
        >
          <div
            className={`min-h-0 overflow-hidden transition-[opacity,transform] duration-150 ease-out ${
              showSecondaryNode ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
            }`}
          >
            <div className={showSecondaryNode ? 'pt-3 border-t border-gray-200' : ''}>{secondaryNode}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
