import React from 'react';

interface SelectFieldProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export default function SelectField({ value, options, onChange }: SelectFieldProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 text-[11px] bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
