import { ColumnTemplateManager } from './ColumnTemplateManager';

const meta = {
  title: 'CRM/Column Customizer/Template Manager',
  component: ColumnTemplateManager,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

const templates = [
  {
    id: 'default',
    name: 'All Columns',
    description: 'Show all available customer fields',
    isDefault: true,
    configs: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'compact',
    name: 'Compact View',
    description: 'Essential customer identifiers',
    isDefault: false,
    configs: [],
    createdAt: new Date().toISOString(),
  },
];

export const Default = {
  args: {
    templates,
    activeTemplateId: 'compact',
    onSelect: () => undefined,
    onRequestSave: () => undefined,
    onRequestDelete: () => undefined,
    onResetToDefaults: () => undefined,
  },
};
