'use client';

import { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { TextBox } from '../types/certificate';

interface TextBoxEditorProps {
  textBox: TextBox;
  onUpdate: (textBox: TextBox) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  scale: number; // Scale factor for positioning
}

export default function TextBoxEditor({
  textBox,
  onUpdate,
  onDelete,
  onSelect,
  isSelected,
  scale
}: TextBoxEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(textBox.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditText(textBox.text);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate({ ...textBox, text: editText });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditText(textBox.text);
      setIsEditing(false);
    }
  };

  const handleDrag = (e: any, data: any) => {
    onUpdate({
      ...textBox,
      x: data.x / scale,
      y: data.y / scale
    });
  };

  const handleStyleChange = (property: keyof TextBox, value: any) => {
    onUpdate({ ...textBox, [property]: value });
  };

  return (
    <Draggable
      position={{ x: textBox.x * scale, y: textBox.y * scale }}
      onDrag={handleDrag}
      handle=".drag-handle"
      disabled={isEditing}
    >
      <div
        className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => onSelect(textBox.id)}
        style={{
          minWidth: textBox.width ? `${textBox.width * scale}px` : 'auto',
          minHeight: textBox.height ? `${textBox.height * scale}px` : 'auto'
        }}
      >
        <div className="drag-handle relative group">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="bg-white border-2 border-blue-500 px-2 py-1 rounded min-w-[100px]"
              style={{
                fontSize: `${textBox.fontSize * scale}px`,
                fontFamily: textBox.fontFamily,
                color: textBox.color,
                textAlign: textBox.alignment
              }}
            />
          ) : (
            <div
              className="px-2 py-1 bg-white bg-opacity-80 rounded border border-gray-300 group-hover:border-blue-500"
              onDoubleClick={handleDoubleClick}
              style={{
                fontSize: `${textBox.fontSize * scale}px`,
                fontFamily: textBox.fontFamily,
                color: textBox.color,
                textAlign: textBox.alignment,
                minWidth: '50px'
              }}
            >
              {textBox.text || 'Double-click to edit'}
            </div>
          )}
          {isSelected && !isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(textBox.id);
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </Draggable>
  );
}

interface TextBoxControlsProps {
  textBox: TextBox;
  onUpdate: (textBox: TextBox) => void;
  fields: Array<{ name: string; label: string }>;
}

export function TextBoxControls({ textBox, onUpdate, fields }: TextBoxControlsProps) {
  const handleChange = (property: keyof TextBox, value: any) => {
    onUpdate({ ...textBox, [property]: value });
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="font-semibold text-lg">Text Box Settings</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Content
        </label>
        <input
          type="text"
          value={textBox.text}
          onChange={(e) => handleChange('text', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Link to Field (Optional)
        </label>
        <select
          value={textBox.fieldName || ''}
          onChange={(e) => handleChange('fieldName', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">None - Static Text</option>
          {fields.map((field) => (
            <option key={field.name} value={field.name}>
              {field.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Font Size: {textBox.fontSize}px
        </label>
        <input
          type="range"
          min="8"
          max="72"
          value={textBox.fontSize}
          onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Font Family
        </label>
        <select
          value={textBox.fontFamily}
          onChange={(e) => handleChange('fontFamily', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Helvetica">Helvetica</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Color
        </label>
        <input
          type="color"
          value={textBox.color}
          onChange={(e) => handleChange('color', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alignment
        </label>
        <select
          value={textBox.alignment}
          onChange={(e) => handleChange('alignment', e.target.value as 'left' | 'center' | 'right')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}
