'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Settings, 
  ArrowLeft,
  Search,
  Copy,
  Eye
} from "lucide-react";
import Link from "next/link";
import FormConfigEditor from "@/components/FormConfigEditor";
import { useFormConfig, FormConfiguration, FormField } from "@/hooks/useFormConfig";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FormConfigurationPage() {
  const { 
    allConfigs, 
    loading, 
    error, 
    fetchAllConfigs, 
    createFormConfig, 
    updateFormConfig, 
    deleteFormConfig 
  } = useFormConfig();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConfig, setEditingConfig] = useState<FormConfiguration | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewConfig, setPreviewConfig] = useState<FormConfiguration | null>(null);

  useEffect(() => {
    fetchAllConfigs();
  }, [fetchAllConfigs]);

  // Filter configs by search
  const filteredConfigs = allConfigs.filter(config =>
    config.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (config.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle save (create or update)
  const handleSave = async (config: FormConfiguration) => {
    try {
      if (config.id) {
        await updateFormConfig(config.id, config);
      } else {
        await createFormConfig(config);
      }
      setEditingConfig(null);
      setIsCreating(false);
      fetchAllConfigs();
    } catch (err) {
      console.error('Error saving config:', err);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteFormConfig(deleteConfirmId);
        setDeleteConfirmId(null);
      } catch (err) {
        console.error('Error deleting config:', err);
      }
    }
  };

  // Duplicate a config
  const handleDuplicate = async (config: FormConfiguration) => {
    const newConfig: Omit<FormConfiguration, 'id'> = {
      formName: `${config.formName}_copy`,
      entityType: config.entityType,
      description: `Copy of ${config.description || config.formName}`,
      fields: [...config.fields],
      isActive: true
    };
    try {
      await createFormConfig(newConfig);
      fetchAllConfigs();
    } catch (err) {
      console.error('Error duplicating config:', err);
    }
  };

  // Create new empty config
  const createNewConfig = (): FormConfiguration => ({
    id: undefined,
    formName: '',
    entityType: 'STUDENT',
    description: '',
    fields: [],
    isActive: true
  } as unknown as FormConfiguration);

  if (editingConfig || isCreating) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => { setEditingConfig(null); setIsCreating(false); }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Form Configurations
          </Button>
        </div>
        <h1 className="text-2xl font-bold mb-6">
          {isCreating ? 'Create New Form Configuration' : 'Edit Form Configuration'}
        </h1>
        <FormConfigEditor
          formConfig={editingConfig || createNewConfig()}
          onSave={handleSave}
          onCancel={() => { setEditingConfig(null); setIsCreating(false); }}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Form Configurations
            </h1>
            <p className="text-gray-500">Manage dynamic form fields for all entity types</p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Form
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by form name, entity type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading form configurations...</p>
        </div>
      ) : (
        /* Table */
        <Card>
          <CardHeader>
            <CardTitle>All Form Configurations ({filteredConfigs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No form configurations found.</p>
                <Button variant="link" onClick={() => setIsCreating(true)}>
                  Create your first form
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Name</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Fields</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.formName}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {config.entityType}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {config.description || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {config.fields?.length || 0} fields
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {config.isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewConfig(config)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingConfig(config)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(config)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => setDeleteConfirmId(config.id ?? null)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the form configuration
              and all its field definitions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewConfig} onOpenChange={() => setPreviewConfig(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview: {previewConfig?.formName}</DialogTitle>
            <DialogDescription>{previewConfig?.description}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {previewConfig?.fields.map((field: FormField) => (
              <div key={field.name} className={field.type === 'textarea' ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select className="w-full px-3 py-2 border rounded-md" disabled>
                    <option>Select {field.label}</option>
                    {field.options?.map((opt: string) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder={field.placeholder}
                    disabled
                    rows={3}
                  />
                ) : (
                  <input
                    type={field.type}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder={field.placeholder || `Enter ${field.label}`}
                    disabled
                  />
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
