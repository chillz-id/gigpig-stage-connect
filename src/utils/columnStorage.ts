import type { TableColumnSettings, ColumnTemplate } from '@/types/column-config';
import { DEFAULT_TEMPLATES, getDefaultColumnConfigs } from '@/types/column-config';

const STORAGE_KEY = 'crm_column_settings';

/**
 * Load column settings from localStorage
 */
export const loadColumnSettings = (): TableColumnSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as TableColumnSettings;

      const defaultColumns = getDefaultColumnConfigs();
      const defaultColumnIds = new Set(defaultColumns.map((col) => col.id));

      const getDefaultConfig = (id: string) => defaultColumns.find((col) => col.id === id);

      // Filter out columns that no longer exist and append any new ones (hidden by default)
      const existingColumns = parsed.columns
        .map((col) =>
          col.id === 'created_at' ? { ...col, id: 'customer_since' } : col
        )
        .filter((col) => defaultColumnIds.has(col.id))
        .map((col) => {
          const defaultConfig = getDefaultConfig(col.id);
          return {
            ...col,
            alignment: col.alignment ?? defaultConfig?.alignment ?? 'left',
          };
        });
      const missingColumns = defaultColumns
        .filter((col) => !existingColumns.some((existing) => existing.id === col.id))
        .map((col, index) => ({
          ...col,
          visible: false,
          order: existingColumns.length + index,
        }));

      const mergedColumns = [...existingColumns, ...missingColumns];

      // Merge with default templates in case new ones were added
      const mergedTemplates = [
        ...DEFAULT_TEMPLATES,
        ...parsed.templates.filter((t) => !t.isDefault),
      ];

      return {
        ...parsed,
        columns: mergedColumns,
        templates: mergedTemplates,
      };
    }
  } catch (error) {
    console.error('Error loading column settings:', error);
  }

  // Return defaults if nothing stored or error
  return {
    columns: getDefaultColumnConfigs(),
    templates: DEFAULT_TEMPLATES,
    activeTemplateId: 'default',
  };
};

/**
 * Save column settings to localStorage
 */
export const saveColumnSettings = (settings: TableColumnSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving column settings:', error);
  }
};

/**
 * Add a new custom template
 */
export const addTemplate = (
  currentSettings: TableColumnSettings,
  name: string,
  description?: string
): TableColumnSettings => {
  const newTemplate: ColumnTemplate = {
    id: `custom-${Date.now()}`,
    name,
    description,
    configs: [...currentSettings.columns],
    createdAt: new Date().toISOString(),
    isDefault: false,
  };

  const newSettings = {
    ...currentSettings,
    templates: [...currentSettings.templates, newTemplate],
    activeTemplateId: newTemplate.id,
  };

  saveColumnSettings(newSettings);
  return newSettings;
};

/**
 * Delete a custom template
 */
export const deleteTemplate = (
  currentSettings: TableColumnSettings,
  templateId: string
): TableColumnSettings => {
  const template = currentSettings.templates.find((t) => t.id === templateId);

  // Prevent deleting default templates
  if (template?.isDefault) {
    throw new Error('Cannot delete default templates');
  }

  const newSettings = {
    ...currentSettings,
    templates: currentSettings.templates.filter((t) => t.id !== templateId),
    activeTemplateId:
      currentSettings.activeTemplateId === templateId
        ? 'default'
        : currentSettings.activeTemplateId,
  };

  // Reset to default columns if deleted template was active
  if (currentSettings.activeTemplateId === templateId) {
    newSettings.columns = getDefaultColumnConfigs();
  }

  saveColumnSettings(newSettings);
  return newSettings;
};

/**
 * Apply a template to current settings
 */
export const applyTemplate = (
  currentSettings: TableColumnSettings,
  templateId: string
): TableColumnSettings => {
  const template = currentSettings.templates.find((t) => t.id === templateId);

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const newSettings = {
    ...currentSettings,
    columns: [...template.configs],
    activeTemplateId: templateId,
  };

  saveColumnSettings(newSettings);
  return newSettings;
};

/**
 * Update current column configurations
 */
export const updateColumnConfigs = (
  currentSettings: TableColumnSettings,
  columns: typeof currentSettings.columns
): TableColumnSettings => {
  const newSettings = {
    ...currentSettings,
    columns,
    // Clear active template when manually adjusting columns
    activeTemplateId: null,
  };

  saveColumnSettings(newSettings);
  return newSettings;
};
