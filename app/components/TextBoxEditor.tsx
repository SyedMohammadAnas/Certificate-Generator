'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;

    const target = e.target as HTMLElement;
    // Don't drag if clicking on the delete button
    if (target.closest('button')) return;

    if (!target.closest('.drag-handle')) return;

    e.preventDefault();
    e.stopPropagation();

    const parentRect = containerRef.current?.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - parentRect.left - (textBox.x * scale),
      y: e.clientY - parentRect.top - (textBox.y * scale)
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const parentRect = containerRef.current.parentElement?.getBoundingClientRect();
      if (!parentRect) return;

      const newX = (e.clientX - parentRect.left - dragStart.x) / scale;
      const newY = (e.clientY - parentRect.top - dragStart.y) / scale;

      onUpdate({
        ...textBox,
        x: Math.max(0, newX),
        y: Math.max(0, newY)
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, scale, textBox, onUpdate]);

  return (
    <div
      ref={containerRef}
      className={`absolute ${isSelected ? 'ring-2 ring-blue-500' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`}
      style={{
        left: `${textBox.x * scale}px`,
        top: `${textBox.y * scale}px`,
        minWidth: textBox.width ? `${textBox.width * scale}px` : 'auto',
        minHeight: textBox.height ? `${textBox.height * scale}px` : 'auto'
      }}
      onClick={() => onSelect(textBox.id)}
      onMouseDown={handleMouseDown}
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
            className="bg-gray-800 border-2 border-blue-500 px-2 py-1 rounded min-w-[100px] text-white"
            style={{
              fontSize: `${textBox.fontSize * scale}px`,
              fontFamily: textBox.fontFamily,
              color: textBox.color,
              textAlign: textBox.alignment
            }}
          />
        ) : (
          <div
            className="px-2 py-1 bg-gray-800 bg-opacity-90 rounded border border-gray-500 group-hover:border-blue-500"
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
    <div className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
      <h3 className="font-semibold text-lg text-white">Text Box Settings</h3>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-1">
          Text Content
        </label>
        <input
          type="text"
          value={textBox.text}
          onChange={(e) => handleChange('text', e.target.value)}
          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-1">
          Link to Field (Optional)
        </label>
        <select
          value={textBox.fieldName || ''}
          onChange={(e) => handleChange('fieldName', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
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
        <label className="block text-sm font-medium text-gray-200 mb-1">
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
        <label className="block text-sm font-medium text-gray-200 mb-1">
          Font Family
        </label>
        <select
          value={textBox.fontFamily}
          onChange={(e) => handleChange('fontFamily', e.target.value)}
          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
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
        <label className="block text-sm font-medium text-gray-200 mb-1">
          Text Color
        </label>
        <input
          type="color"
          value={textBox.color}
          onChange={(e) => handleChange('color', e.target.value)}
          className="w-full h-10 border border-gray-600 rounded-md cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-1">
          Alignment
        </label>
        <select
          value={textBox.alignment}
          onChange={(e) => handleChange('alignment', e.target.value as 'left' | 'center' | 'right')}
          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}
