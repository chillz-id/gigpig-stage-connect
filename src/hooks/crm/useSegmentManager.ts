import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCreateSegment, useSegments, type SegmentDefinition } from '@/hooks/useCustomers';

const DEFAULT_COLOR_SWATCH = '#9ca3af';

interface SegmentManagerFormState {
  name: string;
  color: string;
}

interface UseSegmentManagerOptions {
  onSegmentCreated?: (segment: SegmentDefinition) => void;
}

const normalizeHexColor = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const prefixed = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  const isValid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(prefixed);
  if (!isValid) {
    throw new Error('Enter a hex colour like #A855F7 or #FFF');
  }
  return prefixed.toUpperCase();
};

export const useSegmentManager = ({ onSegmentCreated }: UseSegmentManagerOptions = {}) => {
  const { data: segments } = useSegments();
  const createSegment = useCreateSegment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<SegmentManagerFormState>({
    name: '',
    color: '',
  });

  const existingNames = useMemo(() => {
    return new Set((segments ?? []).map((segment) => segment.name.toLowerCase()));
  }, [segments]);

  const previewColor = useMemo(() => {
    if (!form.color) return null;
    return form.color.toUpperCase();
  }, [form.color]);

  const resetForm = useCallback(() => {
    setForm({ name: '', color: '' });
  }, []);

  const setOpen = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        resetForm();
      }
    },
    [resetForm]
  );

  const updateForm = useCallback((updates: Partial<SegmentManagerFormState>) => {
    setForm((previous) => ({
      ...previous,
      ...updates,
    }));
  }, []);

  const submit = useCallback(async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.error('Segment name is required');
      return;
    }

    if (existingNames.has(trimmedName.toLowerCase())) {
      toast.error('A segment with this name already exists.');
      return;
    }

    let normalizedColor: string | undefined;
    try {
      normalizedColor = form.color ? normalizeHexColor(form.color) : undefined;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to use that colour. Please try again.';
      toast.error(message);
      return;
    }

    try {
      const payload = normalizedColor
        ? { name: trimmedName, color: normalizedColor }
        : { name: trimmedName };

      const segment = await createSegment.mutateAsync(payload);

      toast.success(`Segment “${segment.name}” created`);
      onSegmentCreated?.(segment);
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create segment. Please try again.';
      toast.error(message);
    }
  }, [createSegment, existingNames, form.color, form.name, onSegmentCreated, setOpen]);

  const clearColour = useCallback(() => {
    updateForm({ color: '' });
  }, [updateForm]);

  return {
    dialogOpen,
    setDialogOpen: setOpen,
    openDialog: () => setOpen(true),
    closeDialog: () => setOpen(false),
    isSubmitting: createSegment.isPending,
    form,
    updateForm,
    submit,
    previewColor,
    clearColour,
    defaultColourSwatch: DEFAULT_COLOR_SWATCH,
  };
};
