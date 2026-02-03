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
      className="w-full p-2 text-[11px] rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
      style={{ background: 'var(--input-bg)', color: 'var(--card-text)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--input-border)' }}
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
