import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { NotionPropertySchema, PropertyValue, PropertyValueMap } from '../types/notion';
import SelectField from './fields/SelectField';
import MultiSelectField from './fields/MultiSelectField';
import CheckboxField from './fields/CheckboxField';

interface PreviewCardProps {
  values: PropertyValueMap;
  schemas: NotionPropertySchema[];
  skippedFields: string[];
  onConfirm: (editedValues: PropertyValueMap) => void;
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

export default function PreviewCard({
  values,
  schemas,
  skippedFields,
  onConfirm,
  onCancel,
  isSubmitting,
}: PreviewCardProps) {
  const [editedValues, setEditedValues] = useState<PropertyValueMap>({ ...values });
  const [showSkipped, setShowSkipped] = useState(false);

  const updateValue = (name: string, val: PropertyValue) => {
    setEditedValues((prev) => ({ ...prev, [name]: val }));
  };

  const renderField = (schema: NotionPropertySchema) => {
    const val = editedValues[schema.name];

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
      default:
        return (
          <input
            type="text"
            value={String(val ?? '')}
            onChange={(e) => updateValue(schema.name, e.target.value)}
            className="w-full p-2 text-[11px] bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
          />
        );
    }
  };

  const populatedSchemas = schemas.filter((s) => editedValues[s.name] !== undefined && editedValues[s.name] !== '');
  const emptySchemas = schemas.filter((s) => editedValues[s.name] === undefined || editedValues[s.name] === '');

  return (
    <div className="space-y-3 animate-in zoom-in-95">
      <div className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
        Preview
      </div>

      <div className="space-y-2.5">
        {populatedSchemas.map((schema) => (
          <div key={schema.name} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-600">{schema.name}</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${TYPE_BADGES[schema.type] ?? 'bg-gray-100 text-gray-500'}`}>
                {schema.type}
              </span>
            </div>
            {renderField(schema)}
          </div>
        ))}

        {emptySchemas.length > 0 && (
          <div className="pt-1">
            <div className="text-[9px] font-bold text-gray-400 mb-1.5">Empty fields (click to add)</div>
            {emptySchemas.map((schema) => (
              <div key={schema.name} className="space-y-1 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400">{schema.name}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md opacity-60 ${TYPE_BADGES[schema.type] ?? 'bg-gray-100 text-gray-500'}`}>
                    {schema.type}
                  </span>
                </div>
                {renderField(schema)}
              </div>
            ))}
          </div>
        )}
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
          onClick={() => onConfirm(editedValues)}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors text-[11px] font-bold active:scale-[0.98] disabled:opacity-50"
        >
          <Check size={12} />
          {isSubmitting ? 'Syncing...' : 'Sync to Notion'}
        </button>
      </div>
    </div>
  );
}
