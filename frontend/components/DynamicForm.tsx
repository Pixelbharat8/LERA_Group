"use client";

import React from 'react';
import { FormFieldConfig, getFieldsBySection } from '@/lib/form-config';

interface DynamicFormProps {
  fields: FormFieldConfig[];
  sections: { id: string; title: string; icon: string }[];
  data: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  selectOptions?: Record<string, { value: string; label: string }[]>;
}

export default function DynamicForm({
  fields,
  sections,
  data,
  onChange,
  errors = {},
  disabled = false,
  selectOptions = {},
}: DynamicFormProps) {
  const renderField = (field: FormFieldConfig) => {
    const value = data[field.name] ?? '';
    const error = errors[field.name];
    const options = field.options?.length ? field.options : selectOptions[field.name] || [];
    
    const baseInputClass = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`;
    
    const widthClass = field.width === 'full' ? 'col-span-2' : field.width === 'third' ? 'col-span-1' : 'col-span-1';
    
    return (
      <div key={field.name} className={widthClass}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.type === 'select' ? (
          <select
            value={String(value)}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={baseInputClass}
            disabled={disabled}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            value={String(value)}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={`${baseInputClass} min-h-[80px]`}
            disabled={disabled}
            required={field.required}
            placeholder={field.placeholder}
          />
        ) : field.type === 'checkbox' ? (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(field.name, e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={disabled}
          />
        ) : field.type === 'file' ? (
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(field.name, file);
            }}
            className={baseInputClass}
            disabled={disabled}
            accept="image/*"
          />
        ) : (
          <input
            type={field.type}
            value={String(value)}
            onChange={(e) => onChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
            className={baseInputClass}
            disabled={disabled}
            required={field.required}
            placeholder={field.placeholder}
          />
        )}
        
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const sectionFields = getFieldsBySection(fields, section.id);
        if (sectionFields.length === 0) return null;
        
        return (
          <div key={section.id} className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>{section.icon}</span>
              {section.title}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {sectionFields.map(renderField)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
