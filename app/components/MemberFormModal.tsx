'use client';

import { useState, useEffect } from 'react';
import { Member, FieldDefinition } from '../types/certificate';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member) => void;
  fields: FieldDefinition[];
  existingMember?: Member;
}

export default function MemberFormModal({
  isOpen,
  onClose,
  onSave,
  fields,
  existingMember
}: MemberFormModalProps) {
  const [memberData, setMemberData] = useState<Partial<Member>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingMember) {
      setMemberData(existingMember);
    } else {
      setMemberData({});
    }
    setErrors({});
  }, [existingMember, isOpen]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setMemberData((prev) => ({
      ...prev,
      [fieldName]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    fields.forEach((field) => {
      if (field.required && !memberData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const member: Member = {
      id: existingMember?.id || Date.now().toString(),
      ...memberData
    };

    onSave(member);
    setMemberData({});
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setMemberData({});
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">
            {existingMember ? 'Edit Member' : 'Add Member'}
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
        <div className="p-6">
          {fields.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">
                No fields defined yet. Please add fields first.
              </p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  {field.type === 'date' ? (
                    <input
                      type="date"
                      value={memberData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md bg-gray-700 text-white ${
                        errors[field.name] ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                  ) : field.type === 'email' ? (
                    <input
                      type="email"
                      value={memberData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className={`w-full px-3 py-2 border rounded-md bg-gray-700 text-white ${
                        errors[field.name] ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={memberData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className={`w-full px-3 py-2 border rounded-md bg-gray-700 text-white ${
                        errors[field.name] ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                  )}
                  {errors[field.name] && (
                    <p className="text-red-400 text-xs mt-1">{errors[field.name]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {fields.length > 0 && (
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
              {existingMember ? 'Update' : 'Add'} Member
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
