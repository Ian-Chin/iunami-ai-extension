import React from 'react';

interface MultiSelectFieldProps {
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
}

export default function MultiSelectField({ value, options, onChange }: MultiSelectFieldProps) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
              selected
                ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
