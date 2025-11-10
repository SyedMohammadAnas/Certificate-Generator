'use client';

import { useState } from 'react';
import { Member, FieldDefinition } from '../types/certificate';

interface MemberManagerProps {
  members: Member[];
  fields: FieldDefinition[];
  onMembersChange: (members: Member[]) => void;
  onFieldsChange: (fields: FieldDefinition[]) => void;
}

export default function MemberManager({
  members,
  fields,
  onMembersChange,
  onFieldsChange
}: MemberManagerProps) {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState<Partial<Member>>({});

  const handleAddMember = () => {
    if (Object.keys(newMember).length === 0) {
      setIsAddingMember(true);
      return;
    }

    const member: Member = {
      id: Date.now().toString(),
      ...newMember
    };
    onMembersChange([...members, member]);
    setNewMember({});
    setIsAddingMember(false);
  };

  const handleUpdateMember = (id: string, updates: Partial<Member>) => {
    onMembersChange(
      members.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    setEditingMemberId(null);
  };

  const handleDeleteMember = (id: string) => {
    onMembersChange(members.filter((m) => m.id !== id));
  };

  const handleAddField = () => {
    const fieldName = prompt('Enter field name (e.g., "name", "email"):');
    if (fieldName && !fields.find((f) => f.name === fieldName)) {
      const fieldLabel = prompt('Enter field label (e.g., "Full Name", "Email Address"):') || fieldName;
      const fieldType = prompt('Enter field type (text/email/date/custom):') || 'text';

      onFieldsChange([
        ...fields,
        {
          name: fieldName,
          label: fieldLabel,
          type: fieldType as 'text' | 'email' | 'date' | 'custom',
          required: false
        }
      ]);
    }
  };

  const handleDeleteField = (fieldName: string) => {
    if (members.some((m) => m[fieldName] !== undefined)) {
      if (!confirm('This field is used by members. Delete anyway?')) {
        return;
      }
    }
    onFieldsChange(fields.filter((f) => f.name !== fieldName));
    // Remove field from all members
    onMembersChange(
      members.map((m) => {
        const { [fieldName]: _, ...rest } = m;
        return rest;
      })
    );
  };

  const renderMemberForm = (member: Partial<Member>, isNew: boolean) => {
    return (
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'date' ? (
              <input
                type="date"
                value={member[field.name] || ''}
                onChange={(e) => {
                  if (isNew) {
                    setNewMember({ ...newMember, [field.name]: e.target.value });
                  } else {
                    handleUpdateMember(member.id!, { [field.name]: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            ) : (
              <input
                type={field.type === 'email' ? 'email' : 'text'}
                value={member[field.name] || ''}
                onChange={(e) => {
                  if (isNew) {
                    setNewMember({ ...newMember, [field.name]: e.target.value });
                  } else {
                    handleUpdateMember(member.id!, { [field.name]: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            )}
          </div>
        ))}
        <div className="flex gap-2">
          {isNew ? (
            <>
              <button
                onClick={handleAddMember}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Member
              </button>
              <button
                onClick={() => {
                  setIsAddingMember(false);
                  setNewMember({});
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditingMemberId(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Members</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAddField}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Add Field
          </button>
          <button
            onClick={() => setIsAddingMember(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Member
          </button>
        </div>
      </div>

      {/* Field Definitions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3">Field Definitions</h3>
        <div className="space-y-2">
          {fields.length === 0 ? (
            <p className="text-gray-500 text-sm">No fields defined. Add a field to get started.</p>
          ) : (
            fields.map((field) => (
              <div
                key={field.name}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div>
                  <span className="font-medium">{field.label}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({field.name}) - {field.type}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteField(field.name)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Member Form */}
      {isAddingMember && renderMemberForm(newMember, true)}

      {/* Members List */}
      <div className="space-y-4">
        {members.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No members added yet. Add your first member above.</p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              {editingMemberId === member.id ? (
                renderMemberForm(member, false)
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {fields.map((field) => (
                        <div key={field.name}>
                          <span className="text-sm text-gray-500">{field.label}:</span>
                          <span className="ml-2 font-medium">
                            {member[field.name] || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingMemberId(member.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
