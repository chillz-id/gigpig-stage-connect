import { useState, useEffect, useCallback } from 'react';
import type { TableColumnSettings, ColumnConfig } from '@/types/column-config';
import {
  loadColumnSettings,
  saveColumnSettings,
  addTemplate,
  deleteTemplate,
  applyTemplate,
  updateColumnConfigs,
} from '@/utils/columnStorage';

/**
 * useColumnSettings Hook
 *
 * Manages table column customization with:
 * - Visibility toggles
 * - Width adjustments
 * - Template save/load/delete
 * - LocalStorage persistence
 */
export const useColumnSettings = () => {
  const [settings, setSettings] = useState<TableColumnSettings>(() =>
    loadColumnSettings()
  );

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    saveColumnSettings(settings);
  }, [settings]);

  const handleConfigsChange = useCallback((newConfigs: ColumnConfig[]) => {
    setSettings((prev) => updateColumnConfigs(prev, newConfigs));
  }, []);

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSettings((prev) => applyTemplate(prev, templateId));
  }, []);

  const handleTemplateSave = useCallback(
    (name: string, description?: string) => {
      setSettings((prev) => addTemplate(prev, name, description));
    },
    []
  );

  const handleTemplateDelete = useCallback((templateId: string) => {
    setSettings((prev) => deleteTemplate(prev, templateId));
  }, []);

  return {
    settings,
    columns: settings.columns,
    templates: settings.templates,
    activeTemplateId: settings.activeTemplateId,
    onConfigsChange: handleConfigsChange,
    onTemplateSelect: handleTemplateSelect,
    onTemplateSave: handleTemplateSave,
    onTemplateDelete: handleTemplateDelete,
  };
};
