'use client';

import React from 'react';
import { INPUT_STYLES, INPUT_ERROR } from '@/lib/designSystem';

interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'date' | 'time' | 'tel';
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
  step?: string;
  min?: string;
  max?: string;
}

export function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error = false,
  errorMessage,
  label,
  required = false,
  autoFocus = false,
  className = '',
  step,
  min,
  max,
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoFocus={autoFocus}
        step={step}
        min={min}
        max={max}
        className={`${error ? INPUT_ERROR : INPUT_STYLES} ${className}`}
      />
      {error && errorMessage && (
        <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}

interface SelectProps {
  options: Array<{ value: string | number; label: string }>;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  disabled = false,
  error = false,
  errorMessage,
  label,
  required = false,
  placeholder,
  className = '',
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${error ? INPUT_ERROR : INPUT_STYLES} ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && errorMessage && (
        <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}

interface TextareaProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  required?: boolean;
  rows?: number;
  className?: string;
}

export function Textarea({
  placeholder,
  value,
  onChange,
  disabled = false,
  error = false,
  errorMessage,
  label,
  required = false,
  rows = 4,
  className = '',
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        className={`${error ? INPUT_ERROR : INPUT_STYLES} resize-none ${className}`}
      />
      {error && errorMessage && (
        <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
