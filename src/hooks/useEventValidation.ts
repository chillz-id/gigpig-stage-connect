import { useState, useEffect, useCallback, useRef } from 'react';
import { EventFormData, RecurringSettings } from '@/types/eventTypes';
import { 
  validateEventFormEnhanced, 
  validateField,
  hasUnsavedChanges,
  ValidationResult 
} from '@/utils/eventValidation.enhanced';
import { debounce } from '@/utils/debounce';

interface UseEventValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export const useEventValidation = (
  formData: EventFormData,
  eventSpots: any[],
  recurringSettings: RecurringSettings,
  options: UseEventValidationOptions = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = options;

  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: {},
    warnings: {}
  });

  const [fieldValidation, setFieldValidation] = useState<Record<string, {
    errors: string[],
    warnings: string[]
  }>>({});

  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  // Store initial values for comparison
  const initialValuesRef = useRef({
    formData: { ...formData },
    eventSpots: [...eventSpots],
    recurringSettings: { ...recurringSettings }
  });

  // Validate entire form
  const validateForm = useCallback(() => {
    const result = validateEventFormEnhanced(formData, recurringSettings);
    setValidationResult(result);
    return result;
  }, [formData, recurringSettings]);

  // Debounced validation
  const debouncedValidateForm = useRef(
    debounce(() => {
      validateForm();
    }, debounceMs)
  ).current;

  // Validate single field
  const validateSingleField = useCallback((
    fieldName: keyof EventFormData,
    value: any,
    runImmediately = false
  ) => {
    const validation = validateField(fieldName, value, formData, recurringSettings);
    
    setFieldValidation(prev => ({
      ...prev,
      [fieldName]: validation
    }));

    // Also trigger full form validation
    if (runImmediately) {
      validateForm();
    } else {
      debouncedValidateForm();
    }
    
    return validation;
  }, [formData, recurringSettings, validateForm, debouncedValidateForm]);

  // Mark field as touched
  const touchField = useCallback((fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  }, []);

  // Check if form has unsaved changes
  useEffect(() => {
    const hasChanges = hasUnsavedChanges(
      formData,
      initialValuesRef.current.formData,
      eventSpots,
      initialValuesRef.current.eventSpots,
      recurringSettings,
      initialValuesRef.current.recurringSettings
    );
    setIsDirty(hasChanges);
  }, [formData, eventSpots, recurringSettings]);

  // Auto-validate on change if enabled
  useEffect(() => {
    if (validateOnChange && isDirty) {
      debouncedValidateForm();
    }
  }, [formData, recurringSettings, isDirty, validateOnChange, debouncedValidateForm]);

  // Field change handler
  const handleFieldChange = useCallback((
    fieldName: keyof EventFormData,
    value: any
  ) => {
    if (validateOnChange) {
      validateSingleField(fieldName, value);
    }
  }, [validateOnChange, validateSingleField]);

  // Field blur handler
  const handleFieldBlur = useCallback((
    fieldName: keyof EventFormData,
    value: any
  ) => {
    touchField(fieldName);
    if (validateOnBlur) {
      validateSingleField(fieldName, value, true);
    }
  }, [validateOnBlur, validateSingleField, touchField]);

  // Get field-specific errors and warnings
  const getFieldValidation = useCallback((fieldName: string) => {
    const isFieldTouched = touchedFields.has(fieldName);
    const fieldVal = fieldValidation[fieldName] || { errors: [], warnings: [] };
    const formVal = validationResult;

    // Combine field-level and form-level validation
    const errors = [
      ...fieldVal.errors,
      ...(formVal.errors[fieldName] || [])
    ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    const warnings = [
      ...fieldVal.warnings,
      ...(formVal.warnings[fieldName] || [])
    ].filter((v, i, a) => a.indexOf(v) === i);

    return {
      errors: isFieldTouched ? errors : [],
      warnings: warnings, // Always show warnings
      hasError: isFieldTouched && errors.length > 0,
      hasWarning: warnings.length > 0,
      isTouched: isFieldTouched
    };
  }, [touchedFields, fieldValidation, validationResult]);

  // Reset validation state
  const resetValidation = useCallback(() => {
    setValidationResult({
      isValid: true,
      errors: {},
      warnings: {}
    });
    setFieldValidation({});
    setTouchedFields(new Set());
    setIsDirty(false);
    initialValuesRef.current = {
      formData: { ...formData },
      eventSpots: [...eventSpots],
      recurringSettings: { ...recurringSettings }
    };
  }, [formData, eventSpots, recurringSettings]);

  // Force validation of all fields
  const validateAllFields = useCallback(() => {
    // Touch all fields
    Object.keys(formData).forEach(field => touchField(field));
    
    // Run validation
    return validateForm();
  }, [formData, validateForm, touchField]);

  return {
    // Validation state
    validationResult,
    fieldValidation,
    touchedFields,
    isDirty,
    
    // Validation methods
    validateForm,
    validateSingleField,
    validateAllFields,
    handleFieldChange,
    handleFieldBlur,
    touchField,
    getFieldValidation,
    resetValidation,
    
    // Computed properties
    isValid: validationResult.isValid,
    hasErrors: Object.keys(validationResult.errors).length > 0,
    hasWarnings: Object.keys(validationResult.warnings).length > 0,
    errorCount: Object.values(validationResult.errors).flat().length,
    warningCount: Object.values(validationResult.warnings).flat().length
  };
};

// Helper hook for individual form fields
export const useFieldValidation = (
  fieldName: keyof EventFormData,
  value: any,
  validation: ReturnType<typeof useEventValidation>
) => {
  const fieldValidation = validation.getFieldValidation(fieldName);
  
  const handleChange = useCallback((newValue: any) => {
    validation.handleFieldChange(fieldName, newValue);
  }, [validation, fieldName]);
  
  const handleBlur = useCallback(() => {
    validation.handleFieldBlur(fieldName, value);
  }, [validation, fieldName, value]);
  
  return {
    ...fieldValidation,
    onChange: handleChange,
    onBlur: handleBlur
  };
};