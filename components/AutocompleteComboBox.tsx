import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface AutocompleteComboBoxProps {
  options: Option[];
  value: string;
  onChange: (value: string, label?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function AutocompleteComboBox({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  className = '',
  disabled = false,
}: AutocompleteComboBoxProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState<Option[]>(options);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFiltered(
      options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          opt.value.toLowerCase().includes(inputValue.toLowerCase())
      )
    );
  }, [inputValue, options]);

  useEffect(() => {
    if (!isOpen) setInputValue('');
  }, [isOpen]);

  useEffect(() => {
    // Atualiza inputValue se value mudar externamente
    const selected = options.find((o) => o.value === value);
    if (selected && !isOpen) setInputValue(selected.label);
  }, [value, options, isOpen]);

  return (
    <div className={`relative w-full ${className}`} tabIndex={0} onBlur={() => setTimeout(() => setIsOpen(false), 100)}>
      <input
        ref={inputRef}
        type="text"
        className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
        placeholder={placeholder}
        value={isOpen ? inputValue : options.find((o) => o.value === value)?.label || ''}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        disabled={disabled}
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-300 rounded w-full mt-1 max-h-48 overflow-auto shadow-lg">
          {filtered.map((opt) => (
            <li
              key={opt.value}
              className={`px-2 py-1 text-xs cursor-pointer hover:bg-blue-100 ${opt.value === value ? 'bg-blue-50 font-semibold' : ''}`}
              onMouseDown={() => {
                onChange(opt.value, opt.label);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
