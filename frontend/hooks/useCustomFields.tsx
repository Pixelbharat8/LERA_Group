"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export type CustomField = {
  id: string;
  entityType: string;
  fieldName: string;
  fieldLabel: string;
  fieldLabelVi?: string;
  fieldType: "text" | "number" | "date" | "select" | "multiselect" | "checkbox" | "textarea" | "email" | "phone" | "url" | "file";
  options?: string[];
  isRequired: boolean;
  isActive: boolean;
  showInTable: boolean;
  showInForm: boolean;
  sortOrder: number;
  placeholder?: string;
  defaultValue?: string;
  validationRegex?: string;
  minValue?: number;
  maxValue?: number;
  helpText?: string;
};

export type CustomFieldValue = {
  fieldId: string;
  fieldName: string;
  value: string | number | boolean | string[];
};

interface UseCustomFieldsOptions {
  entityType: string;
  context?: "form" | "table" | "all";
}

interface UseCustomFieldsReturn {
  fields: CustomField[];
  loading: boolean;
  error: string | null;
  getFieldValue: (data: Record<string, any>, fieldName: string) => any;
  setFieldValue: (data: Record<string, any>, fieldName: string, value: any) => Record<string, any>;
  validateField: (field: CustomField, value: any) => string | null;
  validateAllFields: (fields: CustomField[], data: Record<string, any>) => Record<string, string>;
  renderField: (field: CustomField, value: any, onChange: (value: any) => void, language?: string) => React.ReactElement;
  renderTableHeader: (language?: string) => React.ReactElement[];
  renderTableCell: (field: CustomField, data: Record<string, any>) => React.ReactElement;
  getInitialValues: () => Record<string, any>;
  refetch: () => Promise<void>;
}

export function useCustomFields({ entityType, context = "all" }: UseCustomFieldsOptions): UseCustomFieldsReturn {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try custom fields API first
      const data = await apiFetch(`/api/custom-fields/entity/${entityType}`);
      let customFields = Array.isArray(data) ? data : [];
      
      // Filter based on context
      if (context === "form") {
        customFields = customFields.filter((f: CustomField) => f.showInForm && f.isActive);
      } else if (context === "table") {
        customFields = customFields.filter((f: CustomField) => f.showInTable && f.isActive);
      } else {
        customFields = customFields.filter((f: CustomField) => f.isActive);
      }
      
      // Sort by sortOrder
      customFields.sort((a: CustomField, b: CustomField) => a.sortOrder - b.sortOrder);
      
      setFields(customFields);
    } catch {
      // Try system settings fallback
      try {
        const settingsData = await apiFetch(`/api/system-settings/category/custom_fields_${entityType}`);
        if (Array.isArray(settingsData)) {
          let parsedFields = settingsData.map((item: any) => {
            try {
              return JSON.parse(item.settingValue);
            } catch {
              return null;
            }
          }).filter(Boolean);
          
          // Filter based on context
          if (context === "form") {
            parsedFields = parsedFields.filter((f: CustomField) => f.showInForm && f.isActive);
          } else if (context === "table") {
            parsedFields = parsedFields.filter((f: CustomField) => f.showInTable && f.isActive);
          } else {
            parsedFields = parsedFields.filter((f: CustomField) => f.isActive);
          }
          
          parsedFields.sort((a: CustomField, b: CustomField) => a.sortOrder - b.sortOrder);
          setFields(parsedFields);
        } else {
          setFields([]);
        }
      } catch (err) {
        console.error("Error fetching custom fields:", err);
        setError("Failed to load custom fields");
        setFields([]);
      }
    } finally {
      setLoading(false);
    }
  }, [entityType, context]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const getFieldValue = (data: Record<string, any>, fieldName: string): any => {
    // Check customFields object first, then root level
    if (data.customFields && data.customFields[fieldName] !== undefined) {
      return data.customFields[fieldName];
    }
    if (data[fieldName] !== undefined) {
      return data[fieldName];
    }
    // Check with cf_ prefix
    if (data[`cf_${fieldName}`] !== undefined) {
      return data[`cf_${fieldName}`];
    }
    return null;
  };

  const setFieldValue = (data: Record<string, any>, fieldName: string, value: any): Record<string, any> => {
    return {
      ...data,
      customFields: {
        ...(data.customFields || {}),
        [fieldName]: value
      }
    };
  };

  const validateField = (field: CustomField, value: any): string | null => {
    // Required check
    if (field.isRequired) {
      if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
        return `${field.fieldLabel} is required`;
      }
    }

    // Type-specific validation
    if (value !== null && value !== undefined && value !== "") {
      switch (field.fieldType) {
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            return "Please enter a valid email address";
          }
          break;
        case "phone":
          const phoneRegex = /^[\d\s\-\+\(\)]+$/;
          if (!phoneRegex.test(String(value))) {
            return "Please enter a valid phone number";
          }
          break;
        case "url":
          try {
            new URL(String(value));
          } catch {
            return "Please enter a valid URL";
          }
          break;
        case "number":
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return "Please enter a valid number";
          }
          if (field.minValue !== undefined && numValue < field.minValue) {
            return `Value must be at least ${field.minValue}`;
          }
          if (field.maxValue !== undefined && numValue > field.maxValue) {
            return `Value must be at most ${field.maxValue}`;
          }
          break;
      }

      // Custom regex validation
      if (field.validationRegex) {
        try {
          const regex = new RegExp(field.validationRegex);
          if (!regex.test(String(value))) {
            return `Invalid format for ${field.fieldLabel}`;
          }
        } catch {
          // Invalid regex, skip validation
        }
      }
    }

    return null;
  };

  const validateAllFields = (fieldsToValidate: CustomField[], data: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    fieldsToValidate.forEach(field => {
      const value = getFieldValue(data, field.fieldName);
      const error = validateField(field, value);
      if (error) {
        errors[field.fieldName] = error;
      }
    });

    return errors;
  };

  const renderField = (
    field: CustomField, 
    value: any, 
    onChange: (value: any) => void, 
    language: string = "EN"
  ): React.ReactElement => {
    const label = language === "VI" && field.fieldLabelVi ? field.fieldLabelVi : field.fieldLabel;
    const baseInputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

    switch (field.fieldType) {
      case "textarea":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={baseInputClass}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      case "number":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              value={value || ""}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
              placeholder={field.placeholder}
              min={field.minValue}
              max={field.maxValue}
              className={baseInputClass}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      case "date":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              className={baseInputClass}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              className={baseInputClass}
            >
              <option value="">{field.placeholder || `Select ${label}`}</option>
              {(field.options || []).map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      case "multiselect":
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="border border-gray-300 rounded-lg p-2 max-h-40 overflow-y-auto">
              {(field.options || []).map((opt, i) => (
                <label key={i} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(opt)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...selectedValues, opt]);
                      } else {
                        onChange(selectedValues.filter(v => v !== opt));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.id}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onChange(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {label} {field.isRequired && <span className="text-red-500">*</span>}
              </span>
            </label>
            {field.helpText && <p className="text-xs text-gray-500 mt-1 ml-7">{field.helpText}</p>}
          </div>
        );

      case "email":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="email"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || "email@example.com"}
              className={baseInputClass}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      case "phone":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="tel"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || "+84 xxx xxx xxx"}
              className={baseInputClass}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      case "url":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="url"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || "https://example.com"}
              className={baseInputClass}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      case "file":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange(file.name); // Store filename, actual upload handled separately
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {value && <p className="text-xs text-gray-600 mt-1">Current: {value}</p>}
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      default: // text
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              className={baseInputClass}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
    }
  };

  const renderTableHeader = (language: string = "EN"): React.ReactElement[] => {
    return fields
      .filter(f => f.showInTable)
      .map(field => (
        <th key={field.id} className="px-4 py-3 text-left text-sm font-medium text-gray-700">
          {language === "VI" && field.fieldLabelVi ? field.fieldLabelVi : field.fieldLabel}
        </th>
      ));
  };

  const renderTableCell = (field: CustomField, data: Record<string, any>): React.ReactElement => {
    const value = getFieldValue(data, field.fieldName);
    
    if (value === null || value === undefined || value === "") {
      return <td key={field.id} className="px-4 py-3 text-sm text-gray-400">—</td>;
    }

    switch (field.fieldType) {
      case "checkbox":
        return (
          <td key={field.id} className="px-4 py-3 text-sm">
            {value ? "✅" : "❌"}
          </td>
        );
      
      case "multiselect":
        return (
          <td key={field.id} className="px-4 py-3 text-sm">
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(value) ? value : []).map((v, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {v}
                </span>
              ))}
            </div>
          </td>
        );

      case "date":
        return (
          <td key={field.id} className="px-4 py-3 text-sm text-gray-900">
            {new Date(value).toLocaleDateString()}
          </td>
        );

      case "url":
        return (
          <td key={field.id} className="px-4 py-3 text-sm">
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              🔗 Link
            </a>
          </td>
        );

      case "email":
        return (
          <td key={field.id} className="px-4 py-3 text-sm">
            <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
              {value}
            </a>
          </td>
        );

      case "phone":
        return (
          <td key={field.id} className="px-4 py-3 text-sm">
            <a href={`tel:${value}`} className="text-blue-600 hover:underline">
              {value}
            </a>
          </td>
        );

      default:
        return (
          <td key={field.id} className="px-4 py-3 text-sm text-gray-900">
            {String(value)}
          </td>
        );
    }
  };

  const getInitialValues = (): Record<string, any> => {
    const values: Record<string, any> = {};
    
    fields.forEach(field => {
      if (field.defaultValue !== undefined && field.defaultValue !== "") {
        switch (field.fieldType) {
          case "number":
            values[field.fieldName] = Number(field.defaultValue);
            break;
          case "checkbox":
            values[field.fieldName] = field.defaultValue === "true";
            break;
          case "multiselect":
            values[field.fieldName] = field.defaultValue.split(",").map(v => v.trim());
            break;
          default:
            values[field.fieldName] = field.defaultValue;
        }
      } else {
        // Set empty defaults
        switch (field.fieldType) {
          case "checkbox":
            values[field.fieldName] = false;
            break;
          case "multiselect":
            values[field.fieldName] = [];
            break;
          case "number":
            values[field.fieldName] = "";
            break;
          default:
            values[field.fieldName] = "";
        }
      }
    });

    return values;
  };

  return {
    fields,
    loading,
    error,
    getFieldValue,
    setFieldValue,
    validateField,
    validateAllFields,
    renderField,
    renderTableHeader,
    renderTableCell,
    getInitialValues,
    refetch: fetchFields
  };
}

// Helper component for rendering all custom fields in a form
export function CustomFieldsForm({ 
  entityType, 
  data, 
  onChange, 
  errors = {},
  language = "EN" 
}: {
  entityType: string;
  data: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  errors?: Record<string, string>;
  language?: string;
}) {
  const { fields, loading, renderField, getFieldValue } = useCustomFields({ 
    entityType, 
    context: "form" 
  });

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading custom fields...</div>;
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 border-b pb-2">
        {language === "VI" ? "Thông tin bổ sung" : "Additional Information"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(field => (
          <div key={field.id}>
            {renderField(
              field,
              getFieldValue(data, field.fieldName),
              (value) => onChange(field.fieldName, value),
              language
            )}
            {errors[field.fieldName] && (
              <p className="text-red-500 text-xs mt-1">{errors[field.fieldName]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper component for rendering custom field columns in a table
export function CustomFieldsTableHeaders({ 
  entityType, 
  language = "EN" 
}: {
  entityType: string;
  language?: string;
}) {
  const { renderTableHeader } = useCustomFields({ entityType, context: "table" });
  return <>{renderTableHeader(language)}</>;
}

export function CustomFieldsTableCells({ 
  entityType, 
  data 
}: {
  entityType: string;
  data: Record<string, any>;
}) {
  const { fields, renderTableCell } = useCustomFields({ entityType, context: "table" });
  return <>{fields.map(field => renderTableCell(field, data))}</>;
}
