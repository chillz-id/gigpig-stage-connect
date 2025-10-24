import { useCallback, useMemo } from 'react';
import type {
  ColumnAlignment,
  ColumnConfig,
  ColumnDefinition,
} from '@/types/column-config';

interface ColumnOrderingOptions {
  columnDefinitions: ColumnDefinition[];
  columnConfigs: ColumnConfig[];
  onChange: (configs: ColumnConfig[]) => void;
}

export interface OrderedColumnEntry {
  config: ColumnConfig;
  definition: ColumnDefinition;
}

export interface ToggleVisibilityResult {
  success: boolean;
  error?: 'required-column' | 'not-found';
}

export interface WidthChangeResult {
  success: boolean;
  error?: 'min-width' | 'not-found';
}

const normalizeOrder = (configs: ColumnConfig[]): ColumnConfig[] =>
  configs
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((config, index) => ({ ...config, order: index }));

export const useColumnOrdering = ({
  columnDefinitions,
  columnConfigs,
  onChange,
}: ColumnOrderingOptions) => {
  const updateConfigs = useCallback(
    (updater: (configs: ColumnConfig[]) => ColumnConfig[]) => {
      const next = normalizeOrder(updater(columnConfigs));
      onChange(next);
    },
    [columnConfigs, onChange]
  );

  const orderedColumns = useMemo<OrderedColumnEntry[]>(() => {
    const definitionMap = new Map(columnDefinitions.map((definition) => [definition.id, definition]));

    return columnConfigs
      .slice()
      .sort((a, b) => {
        if (a.visible && !b.visible) return -1;
        if (!a.visible && b.visible) return 1;
        return a.order - b.order;
      })
      .map((config) => {
        const definition = definitionMap.get(config.id);
        if (!definition) return null;
        return { config, definition };
      })
      .filter((entry): entry is OrderedColumnEntry => entry !== null);
  }, [columnDefinitions, columnConfigs]);

  const toggleVisibility = useCallback(
    (columnId: string): ToggleVisibilityResult => {
      const column = columnDefinitions.find((definition) => definition.id === columnId);
      const targetConfig = columnConfigs.find((config) => config.id === columnId);

      if (!column || !targetConfig) {
        return { success: false, error: 'not-found' };
      }

      if (column.required && targetConfig.visible) {
        return { success: false, error: 'required-column' };
      }

      updateConfigs((configs) => {
        const maxOrder = configs.length > 0 ? Math.max(...configs.map((config) => config.order)) : -1;

        return configs.map((config) => {
          if (config.id !== columnId) return config;

          const willBeVisible = !config.visible;
          return {
            ...config,
            visible: willBeVisible,
            order: willBeVisible ? maxOrder + 1 : config.order,
          };
        });
      });

      return { success: true };
    },
    [columnConfigs, columnDefinitions, updateConfigs]
  );

  const changeWidth = useCallback(
    (columnId: string, width: number): WidthChangeResult => {
      const column = columnDefinitions.find((definition) => definition.id === columnId);
      if (!column) {
        return { success: false, error: 'not-found' };
      }

      if (width < column.minWidth) {
        return { success: false, error: 'min-width' };
      }

      updateConfigs((configs) =>
        configs.map((config) => (config.id === columnId ? { ...config, width } : config))
      );
      return { success: true };
    },
    [columnDefinitions, updateConfigs]
  );

  const changeAlignment = useCallback(
    (columnId: string, alignment: ColumnAlignment) => {
      updateConfigs((configs) =>
        configs.map((config) => (config.id === columnId ? { ...config, alignment } : config))
      );
    },
    [updateConfigs]
  );

  const moveColumn = useCallback(
    (columnId: string, direction: 'up' | 'down') => {
      updateConfigs((configs) => {
        const sorted = configs.slice().sort((a, b) => a.order - b.order);
        const index = sorted.findIndex((column) => column.id === columnId);

        if (index === -1) return configs;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sorted.length) return configs;

        const [moved] = sorted.splice(index, 1);
        if (!moved) return configs;

        sorted.splice(targetIndex, 0, moved);
        return sorted.map((column, order) => ({ ...column, order }));
      });
    },
    [updateConfigs]
  );

  return {
    orderedColumns,
    toggleVisibility,
    changeWidth,
    changeAlignment,
    moveColumn,
  };
};
