import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'phone';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  dataSource?: string;
  order?: number;
}

interface FormConfiguration {
  id?: string;
  formName: string;
  entityType: string;
  description?: string;
  fields: FormField[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function useFormConfig(formName?: string) {
  const [formConfig, setFormConfig] = useState<FormConfiguration | null>(null);
  const [allConfigs, setAllConfigs] = useState<FormConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch single form config by name
  const fetchFormConfig = useCallback(async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      const config = await apiFetch(`/api/form-configs/${name}`);
      config.fields.sort((a: FormField, b: FormField) => (a.order || 0) - (b.order || 0));
      setFormConfig(config);
      return config;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch form config';
      setError(errorMsg);
      console.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all form configs
  const fetchAllConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const configs = await apiFetch('/api/form-configs');
      setAllConfigs(configs);
      return configs;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch configs';
      setError(errorMsg);
      console.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch configs by entity type
  const fetchConfigsByEntityType = useCallback(async (entityType: string) => {
    setLoading(true);
    setError(null);
    try {
      const configs = await apiFetch(`/api/form-configs/entity/${entityType}`);
      setAllConfigs(configs);
      return configs;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch configs';
      setError(errorMsg);
      console.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new form config
  const createFormConfig = useCallback(async (config: Omit<FormConfiguration, 'id'>) => {
    try {
      const newConfig = await apiFetch('/api/form-configs', {
        method: 'POST',
        body: JSON.stringify(config)
      });
      setAllConfigs(prev => [...prev, newConfig]);
      return newConfig;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create config';
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Update form config
  const updateFormConfig = useCallback(async (id: string, config: Partial<FormConfiguration>) => {
    try {
      const updatedConfig = await apiFetch(`/api/form-configs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      setAllConfigs(prev => prev.map(c => c.id === id ? updatedConfig : c));
      if (formConfig?.id === id) {
        setFormConfig(updatedConfig);
      }
      return updatedConfig;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update config';
      setError(errorMsg);
      throw err;
    }
  }, [formConfig]);

  // Add field to form config
  const addField = useCallback(async (configId: string, field: FormField) => {
    try {
      const updatedConfig = await apiFetch(`/api/form-configs/${configId}/fields`, {
        method: 'POST',
        body: JSON.stringify(field)
      });
      setAllConfigs(prev => prev.map(c => c.id === configId ? updatedConfig : c));
      if (formConfig?.id === configId) {
        setFormConfig(updatedConfig);
      }
      return updatedConfig;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add field';
      setError(errorMsg);
      throw err;
    }
  }, [formConfig]);

  // Remove field from form config
  const removeField = useCallback(async (configId: string, fieldName: string) => {
    try {
      const updatedConfig = await apiFetch(`/api/form-configs/${configId}/fields/${fieldName}`, {
        method: 'DELETE'
      });
      setAllConfigs(prev => prev.map(c => c.id === configId ? updatedConfig : c));
      if (formConfig?.id === configId) {
        setFormConfig(updatedConfig);
      }
      return updatedConfig;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove field';
      setError(errorMsg);
      throw err;
    }
  }, [formConfig]);

  // Delete form config
  const deleteFormConfig = useCallback(async (id: string) => {
    try {
      await apiFetch(`/api/form-configs/${id}`, { method: 'DELETE' });
      setAllConfigs(prev => prev.filter(c => c.id !== id));
      if (formConfig?.id === id) {
        setFormConfig(null);
      }
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete config';
      setError(errorMsg);
      throw err;
    }
  }, [formConfig]);

  // Auto-fetch if formName is provided
  useEffect(() => {
    if (formName) {
      fetchFormConfig(formName);
    }
  }, [formName, fetchFormConfig]);

  return {
    formConfig,
    allConfigs,
    loading,
    error,
    fetchFormConfig,
    fetchAllConfigs,
    fetchConfigsByEntityType,
    createFormConfig,
    updateFormConfig,
    addField,
    removeField,
    deleteFormConfig
  };
}

export type { FormConfiguration, FormField };
