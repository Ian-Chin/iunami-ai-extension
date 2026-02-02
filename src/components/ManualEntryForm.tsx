import React, { useState } from 'react';
import { Send, X, Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { NotionPropertySchema, PropertyValue, PropertyValueMap } from '../types/notion';
import SelectField from './fields/SelectField';
import MultiSelectField from './fields/MultiSelectField';
import CheckboxField from './fields/CheckboxField';

interface ManualEntryFormProps {
  schemas: NotionPropertySchema[];
  skippedFields: string[];
  onSubmit: (values: PropertyValueMap) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const TYPE_BADGES: Record<string, string> = {
  title: 'bg-blue-100 text-blue-600',
  rich_text: 'bg-gray-100 text-gray-600',
  number: 'bg-amber-100 text-amber-600',
  select: 'bg-purple-100 text-purple-600',
  multi_select: 'bg-pink-100 text-pink-600',
  date: 'bg-green-100 text-green-600',
  checkbox: 'bg-cyan-100 text-cyan-600',
  url: 'bg-indigo-100 text-indigo-600',
  email: 'bg-rose-100 text-rose-600',
  phone_number: 'bg-orange-100 text-orange-600',
  status: 'bg-teal-100 text-teal-600',
};

function getDefaultValue(type: string): PropertyValue {
  if (type === 'checkbox') return false;
  if (type === 'number') return '';
  if (type === 'multi_select') return [] as string[];
  return '';
}

export default function ManualEntryForm({
  schemas,
  skippedFields,
  onSubmit,
  onCancel,
  isSubmitting,
}: ManualEntryFormProps) {
  const [values, setValues] = useState<PropertyValueMap>(() => {
    const init: PropertyValueMap = {};
    for (const s of schemas) {
      init[s.name] = getDefaultValue(s.type);
    }
    return init;
  });
  const [error, setError] = useState('');
  const [showSkipped, setShowSkipped] = useState(false);

  const updateValue = (name: string, val: PropertyValue) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = () => {
    const titleField = schemas.find((s) => s.type === 'title');
    if (titleField && !values[titleField.name]) {
      setError(`"${titleField.name}" is required.`);
      return;
    }
    setError('');
    onSubmit(values);
  };

  const renderField = (schema: NotionPropertySchema) => {
    const val = values[schema.name];

    switch (schema.type) {
      case 'select':
      case 'status':
        return (
          <SelectField
            value={String(val ?? '')}
            options={schema.options ?? []}
            onChange={(v) => updateValue(schema.name, v)}
          />
        );
      case 'multi_select':
        return (
          <MultiSelectField
            value={Array.isArray(val) ? val : []}
            options={schema.options ?? []}
            onChange={(v) => updateValue(schema.name, v)}
          />
        );
      case 'checkbox':
        return (
          <CheckboxField
            value={val === true || val === 'true'}
            onChange={(v) => updateValue(schema.name, v)}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={val !== undefined ? String(val) : ''}
            onChange={(e) => updateValue(schema.name, e.target.value ? Number(e.target.value) : '')}
            className="w-full p-2 text-[11px] bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
            placeholder="0"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={String(val ?? '')}
            onChange={(e) => updateValue(schema.name, e.target.value)}
            className="w-full p-2 text-[11px] bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
          />
        );
      case 'url':
        return (
          <input
            type="url"
            value={String(val ?? '')}
            onChange={(e) => updateValue(schema.name, e.target.value)}
            className="w-full p-2 text-[11px] bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
            placeholder="https://..."
          />
        );
      case 'email':
        return (
          <input
            type="email"
            value={String(val ?? '')}
            onChange={(e) => updateValue(schema.name, e.target.value)}
            className="w-full p-2 text-[11px] bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
            placeholder="name@example.com"
          />
        );
      default:
        return (
          <input
            type="text"
            value={String(val ?? '')}
            onChange={(e) => updateValue(schema.name, e.target.value)}
            className="w-full p-2 text-[11px] bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
            placeholder={schema.type === 'phone_number' ? '+1 234 567 8900' : `Enter ${schema.name.toLowerCase()}...`}
          />
        );
    }
  };

  // Sort: title first, then rest
  const sortedSchemas = [...schemas].sort((a, b) => {
    if (a.type === 'title') return -1;
    if (b.type === 'title') return 1;
    return 0;
  });

  return (
    <div className="space-y-3 animate-in zoom-in-95">
      <div className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
        Manual Entry
      </div>

      <div className="space-y-2.5">
        {sortedSchemas.map((schema) => (
          <div key={schema.name} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-600">
                {schema.name}
                {schema.type === 'title' && <span className="text-red-400 ml-0.5">*</span>}
              </span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${TYPE_BADGES[schema.type] ?? 'bg-gray-100 text-gray-500'}`}>
                {schema.type}
              </span>
            </div>
            {renderField(schema)}
          </div>
        ))}
      </div>

      {skippedFields.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowSkipped(!showSkipped)}
            className="flex items-center gap-1.5 text-[9px] font-bold text-amber-500"
          >
            <AlertTriangle size={10} />
            {skippedFields.length} unsupported field{skippedFields.length > 1 ? 's' : ''}
            {showSkipped ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
          {showSkipped && (
            <div className="mt-1.5 text-[10px] text-gray-400 pl-4">
              {skippedFields.join(', ')}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-[10px] font-bold text-red-500 bg-red-50 p-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl transition-colors text-[11px] font-bold disabled:opacity-50"
        >
          <X size={12} />
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors text-[11px] font-bold active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          {isSubmitting ? 'Syncing...' : 'Sync to Notion'}
        </button>
      </div>
    </div>
  );
}
