'use client';

import { useState } from 'react';
import { Member, FieldDefinition, CertificateTemplate } from '../types/certificate';
import PreviewModal from './PreviewModal';
import FieldModal from './FieldModal';
import MemberFormModal from './MemberFormModal';

interface MemberManagerProps {
  members: Member[];
  fields: FieldDefinition[];
  onMembersChange: (members: Member[]) => void;
  onFieldsChange: (fields: FieldDefinition[]) => void;
  template: CertificateTemplate;
}

export default function MemberManager({
  members,
  fields,
  onMembersChange,
  onFieldsChange,
  template
}: MemberManagerProps) {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinition | undefined>(undefined);
  const [previewMemberId, setPreviewMemberId] = useState<string | null>(null);

  const handleSaveMember = (member: Member) => {
    if (editingMemberId) {
      // Update existing member
      onMembersChange(
        members.map((m) => (m.id === editingMemberId ? member : m))
      );
      setEditingMemberId(null);
    } else {
      // Add new member
      onMembersChange([...members, member]);
      setIsAddingMember(false);
    }
  };

  const handleSaveField = (field: FieldDefinition) => {
    if (editingField) {
      // Update existing field
      const oldFieldName = editingField.name;
      const newFieldName = field.name;

      // Update field definition
      const updatedFields = fields.map((f) => (f.name === oldFieldName ? field : f));
      onFieldsChange(updatedFields);

      // Update all members if field name changed
      if (oldFieldName !== newFieldName) {
        onMembersChange(
          members.map((member) => {
            const { [oldFieldName]: oldValue, ...rest } = member;
            return {
              ...rest,
              [newFieldName]: oldValue
            } as Member;
          })
        );
      }
      setEditingField(undefined);
    } else {
      // Add new field
      onFieldsChange([...fields, field]);
      setIsAddingField(false);
    }
  };

  const handleDeleteMember = (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      onMembersChange(members.filter((m) => m.id !== id));
    }
  };

  const handleDeleteField = (fieldName: string) => {
    const isUsed = members.some((m) => m[fieldName] !== undefined && m[fieldName] !== '');
    if (isUsed) {
      if (!confirm('This field is used by members. Deleting it will remove the data from all members. Continue?')) {
        return;
      }
    }
    onFieldsChange(fields.filter((f) => f.name !== fieldName));
    // Remove field from all members
    onMembersChange(
      members.map((m) => {
        const { [fieldName]: _, ...rest } = m;
        return rest as Member;
      })
    );
  };

  const handleEditField = (field: FieldDefinition) => {
    setEditingField(field);
    setIsAddingField(true);
  };


  const previewMember = members.find((m) => m.id === previewMemberId);
  const editingMember = members.find((m) => m.id === editingMemberId);
  const existingFieldNames = fields.map((f) => f.name).filter((name) => !editingField || editingField.name !== name);

  return (
    <div className="space-y-6">
      {/* Preview Modal */}
      {previewMember && template.imageUrl && (
        <PreviewModal
          template={template}
          member={previewMember}
          onClose={() => setPreviewMemberId(null)}
        />
      )}

      {/* Field Modal */}
      <FieldModal
        isOpen={isAddingField}
        onClose={() => {
          setIsAddingField(false);
          setEditingField(undefined);
        }}
        onSave={handleSaveField}
        existingField={editingField}
        existingFieldNames={existingFieldNames}
      />

      {/* Member Form Modal */}
      <MemberFormModal
        isOpen={isAddingMember || editingMemberId !== null}
        onClose={() => {
          setIsAddingMember(false);
          setEditingMemberId(null);
        }}
        onSave={handleSaveMember}
        fields={fields}
        existingMember={editingMember}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Members</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddingField(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Add Field
          </button>
          <button
            onClick={() => setIsAddingMember(true)}
            disabled={fields.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
            title={fields.length === 0 ? 'Add fields first' : ''}
          >
            Add Member
          </button>
        </div>
      </div>

      {/* Field Definitions */}
      <div className="bg-gray-700 rounded-lg border border-gray-600 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Field Definitions</h3>
          {fields.length > 0 && (
            <span className="text-sm text-gray-400">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="space-y-2">
          {fields.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm mb-2">No fields defined yet.</p>
              <p className="text-gray-500 text-xs">Add fields like "name", "date", "venue", "event name" to get started.</p>
            </div>
          ) : (
            fields.map((field) => (
              <div
                key={field.name}
                className="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{field.label}</span>
                    {field.required && (
                      <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">Required</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    <span className="font-mono">{field.name}</span>
                    <span className="mx-2">•</span>
                    <span className="capitalize">{field.type}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditField(field)}
                    className="px-2 py-1 text-blue-400 hover:text-blue-300 text-sm"
                    title="Edit field"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.name)}
                    className="px-2 py-1 text-red-400 hover:text-red-300 text-sm"
                    title="Delete field"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {members.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No members added yet. Add your first member above.</p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="bg-gray-700 rounded-lg border border-gray-600 p-4 hover:border-gray-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {fields.map((field) => (
                      <div key={field.name} className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase tracking-wide">{field.label}</span>
                        <span className="mt-1 font-medium text-white break-words">
                          {member[field.name] || <span className="text-gray-500 italic">Not set</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => setPreviewMemberId(member.id)}
                    className="p-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                    title="Preview Certificate"
                    disabled={!template.imageUrl}
                    aria-label="Preview Certificate"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingMemberId(member.id)}
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    title="Edit Member"
                    aria-label="Edit Member"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    title="Delete Member"
                    aria-label="Delete Member"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
