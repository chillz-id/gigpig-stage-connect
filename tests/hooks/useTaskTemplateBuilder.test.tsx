import React, { PropsWithChildren } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useTaskTemplateBuilder } from '@/components/tasks/template-builder/useTaskTemplateBuilder';
import type { CreateTemplateFormData } from '@/types/task';

// Mock toast and create hook dependencies
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

const mutateMock = jest.fn();

jest.mock('@/hooks/useTasks', () => ({
  useCreateTaskTemplate: () => ({
    mutate: mutateMock,
    isPending: false
  })
}));

function renderHookWithQueryClient<T>(callback: () => T) {
  const queryClient = new QueryClient();

  return renderHookWithProviders(callback, ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  ));
}

function renderHookWithProviders<T>(
  callback: () => T,
  Wrapper: React.ComponentType<PropsWithChildren> = ({ children }) => <>{children}</>
) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const result: { current?: T } = {};

  function TestComponent() {
    result.current = callback();
    return null;
  }

  act(() => {
    root.render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );
  });

  return {
    result: {
      get current() {
        return result.current as T;
      }
    },
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    }
  };
}

function renderUseTaskTemplateBuilder(initialTemplate?: Partial<CreateTemplateFormData>) {
  return renderHookWithQueryClient(() =>
    useTaskTemplateBuilder(initialTemplate ? { initialTemplate } : {})
  );
}

describe('useTaskTemplateBuilder', () => {
  beforeEach(() => {
    mutateMock.mockReset();
  });

  it('initializes with default template when none provided', () => {
    const { result } = renderUseTaskTemplateBuilder();
    const items = result.current.form.getValues('template_items');

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: '',
      priority: 'medium',
      order_index: 0
    });
  });

  it('appends task items and updates order indices when dragging', () => {
    const { result } = renderUseTaskTemplateBuilder();

    act(() => {
      result.current.handleAddTaskItem();
    });

    const beforeDrag = result.current.form.getValues('template_items');
    expect(beforeDrag).toHaveLength(2);
    expect(beforeDrag[1]?.order_index).toBe(1);

    act(() => {
      result.current.handleTaskDragEnd({
        source: { index: 1, droppableId: 'template-items' },
        destination: { index: 0, droppableId: 'template-items' }
      } as any);
    });

    const afterDrag = result.current.form.getValues('template_items');
    expect(afterDrag[0]?.order_index).toBe(0);
    expect(afterDrag[1]?.order_index).toBe(1);
  });

  it('saves variables and resets dialog state', () => {
    const { result } = renderUseTaskTemplateBuilder();

    act(() => {
      result.current.setVariableForm({
        key: 'venue',
        variable: {
          type: 'text',
          label: 'Venue Name',
          description: 'Name of the venue',
          required: true
        }
      });
    });

    act(() => {
      result.current.handleVariableSave();
    });

    const variables = result.current.form.getValues('variables');
    expect(variables.venue).toMatchObject({
      label: 'Venue Name',
      required: true
    });
    expect(result.current.variableDialogOpen).toBe(false);
  });

  it('calls mutate when onSave not provided', async () => {
    const { result } = renderUseTaskTemplateBuilder();

    act(() => {
      result.current.form.setValue('name', 'Template Name');
      result.current.form.setValue('template_items.0.title', 'Task A');
    });

    await act(async () => {
      await result.current.submitTemplate();
    });

    expect(mutateMock).toHaveBeenCalledTimes(1);
  });

  it('uses custom onSave when provided', async () => {
    const onSave = jest.fn();
    const { result } = renderHookWithQueryClient(() => useTaskTemplateBuilder({ onSave }));

    act(() => {
      result.current.form.setValue('name', 'Template Name');
      result.current.form.setValue('template_items.0.title', 'Task A');
    });

    await act(async () => {
      await result.current.submitTemplate();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(mutateMock).not.toHaveBeenCalled();
  });
});
