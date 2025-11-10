'use client';

import { useState, useEffect } from 'react';
import { FieldDefinition } from '../types/certificate';

interface FieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: FieldDefinition) => void;
  existingField?: FieldDefinition;
  existingFieldNames: string[];
}

export default function FieldModal({
  isOpen,
  onClose,
  onSave,
  existingField,
  existingFieldNames
}: FieldModalProps) {
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [required, setRequired] = useState(false);
  const [errors, setErrors] = useState<{ fieldName?: string }>({});

  useEffect(() => {
    if (existingField) {
      setFieldName(existingField.name);
      setFieldLabel(existingField.label);
      setRequired(existingField.required || false);
    } else {
      resetForm();
    }
  }, [existingField, isOpen]);

  const resetForm = () => {
    setFieldName('');
    setFieldLabel('');
    setRequired(false);
    setErrors({});
  };

  const handleSave = () => {
    const newErrors: { fieldName?: string } = {};

    // Validate field name
    if (!fieldName.trim()) {
      newErrors.fieldName = 'Field name is required';
    } else if (!/^[a-z][a-z0-9_]*$/i.test(fieldName.trim())) {
      newErrors.fieldName = 'Field name must start with a letter and contain only letters, numbers, and underscores';
    } else if (existingFieldNames.includes(fieldName.trim()) && (!existingField || existingField.name !== fieldName.trim())) {
      newErrors.fieldName = 'Field name already exists';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: fieldName.trim(),
      label: fieldLabel.trim() || fieldName.trim(),
      type: 'text',
      required
    });

    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">
            {existingField ? 'Edit Field' : 'Add Field'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Field Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => {
                setFieldName(e.target.value);
                setErrors({});
              }}
              placeholder="e.g., name, email, date"
              className={`w-full px-3 py-2 border rounded-md bg-gray-700 text-white ${
                errors.fieldName ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.fieldName && (
              <p className="text-red-400 text-xs mt-1">{errors.fieldName}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              Used internally (letters, numbers, underscores only)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Field Label
            </label>
            <input
              type="text"
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              placeholder="e.g., Full Name, Email Address"
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
            />
            <p className="text-gray-400 text-xs mt-1">
              Display name (if empty, uses field name)
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="required" className="ml-2 text-sm text-gray-200">
              Required field
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {existingField ? 'Update' : 'Add'} Field
          </button>
        </div>
      </div>
    </div>
  );
}
