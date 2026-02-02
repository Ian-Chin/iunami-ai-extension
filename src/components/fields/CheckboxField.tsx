import React from 'react';

interface CheckboxFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function CheckboxField({ value, onChange }: CheckboxFieldProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-10 h-5.5 rounded-full transition-all relative ${
        value ? 'bg-indigo-500' : 'bg-gray-200'
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${
          value ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}
