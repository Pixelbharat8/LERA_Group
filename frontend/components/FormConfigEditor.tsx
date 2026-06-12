'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Settings,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'phone';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  dataSource?: string;
  order?: number;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

interface FormConfiguration {
  id?: string;
  formName: string;
  entityType: string;
  description?: string;
  fields: FormField[];
  isActive: boolean;
}

interface FormConfigEditorProps {
  formConfig: FormConfiguration;
  onSave: (config: FormConfiguration) => Promise<void>;
  onCancel?: () => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'checkbox', label: 'Checkbox' },
];

const ENTITY_TYPES = [
  'STUDENT', 'TEACHER', 'STAFF', 'PARENT', 'CENTER', 'CLASS'
];

export default function FormConfigEditor({ formConfig, onSave, onCancel }: FormConfigEditorProps) {
  const [config, setConfig] = useState<FormConfiguration>(formConfig);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newOptionInput, setNewOptionInput] = useState('');

  // Update config field
  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...config.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setConfig({ ...config, fields: newFields });
  };

  // Add new field
  const addField = () => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      order: config.fields.length + 1
    };
    setConfig({ ...config, fields: [...config.fields, newField] });
    setEditingField(newField);
  };

  // Remove field
  const removeField = (index: number) => {
    const newFields = config.fields.filter((_, i) => i !== index);
    // Re-order remaining fields
    newFields.forEach((f, i) => f.order = i + 1);
    setConfig({ ...config, fields: newFields });
  };

  // Move field up
  const moveFieldUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...config.fields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    newFields.forEach((f, i) => f.order = i + 1);
    setConfig({ ...config, fields: newFields });
  };

  // Move field down
  const moveFieldDown = (index: number) => {
    if (index === config.fields.length - 1) return;
    const newFields = [...config.fields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    newFields.forEach((f, i) => f.order = i + 1);
    setConfig({ ...config, fields: newFields });
  };

  // Add option to select field
  const addOption = (index: number) => {
    if (!newOptionInput.trim()) return;
    const field = config.fields[index];
    const options = field.options || [];
    updateField(index, { options: [...options, newOptionInput.trim()] });
    setNewOptionInput('');
  };

  // Remove option from select field
  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = config.fields[fieldIndex];
    const options = [...(field.options || [])];
    options.splice(optionIndex, 1);
    updateField(fieldIndex, { options });
  };

  // Save configuration
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
    } catch (error) {
      console.error('Error saving form configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Form Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Form Name</Label>
              <Input
                value={config.formName}
                onChange={(e) => setConfig({ ...config, formName: e.target.value })}
                placeholder="e.g., student_registration"
              />
            </div>
            <div>
              <Label>Entity Type</Label>
              <Select
                value={config.entityType}
                onValueChange={(value) => setConfig({ ...config, entityType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={config.description || ''}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Form description"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Form Fields ({config.fields.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="h-4 w-4 mr-1" />
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
              <Button size="sm" onClick={addField}>
                <Plus className="h-4 w-4 mr-1" />
                Add Field
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showPreview ? (
            // Preview Mode
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              {config.fields.map((field) => (
                <div key={field.name} className={field.type === 'textarea' ? 'col-span-2' : ''}>
                  <Label>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === 'select' ? (
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                    </Select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      className="w-full px-3 py-2 border rounded-md bg-white"
                      placeholder={field.placeholder}
                      disabled
                      rows={3}
                    />
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-2">
                      <Checkbox disabled />
                      <span className="text-sm text-gray-500">{field.label}</span>
                    </div>
                  ) : (
                    <Input
                      type={field.type}
                      placeholder={field.placeholder || `Enter ${field.label}`}
                      disabled
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-3">
              {config.fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No fields yet. Click &quot;Add Field&quot; to create one.
                </div>
              ) : (
                config.fields.map((field, index) => (
                  <div
                    key={field.name}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                  >
                    {/* Drag Handle */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveFieldUp(index)}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <button
                        onClick={() => moveFieldDown(index)}
                        disabled={index === config.fields.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Field Settings */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <Label className="text-xs">Field Name</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => updateField(index, { name: e.target.value.replace(/\s/g, '_').toLowerCase() })}
                          placeholder="field_name"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="Display Label"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value: any) => updateField(index, { type: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(index, { required: !!checked })}
                          />
                          <Label className="text-xs">Required</Label>
                        </div>
                      </div>
                      
                      {/* Options for Select */}
                      {field.type === 'select' && (
                        <div className="md:col-span-5">
                          <Label className="text-xs">Options</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(field.options || []).map((opt, optIndex) => (
                              <span
                                key={optIndex}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                              >
                                {opt}
                                <button
                                  onClick={() => removeOption(index, optIndex)}
                                  className="hover:text-red-600"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            <div className="flex gap-1">
                              <Input
                                value={newOptionInput}
                                onChange={(e) => setNewOptionInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addOption(index)}
                                placeholder="Add option..."
                                className="h-7 w-32"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7"
                                onClick={() => addOption(index)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Label className="text-xs">Or Data Source URL</Label>
                            <Input
                              value={field.dataSource || ''}
                              onChange={(e) => updateField(index, { dataSource: e.target.value })}
                              placeholder="/api/centers"
                              className="h-8"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
