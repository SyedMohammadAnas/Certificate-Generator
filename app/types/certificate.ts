export interface TextBox {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  alignment: 'left' | 'center' | 'right';
  fieldName?: string; // Links to member field
  width?: number;
  height?: number;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'custom';
  required?: boolean;
}

export interface Member {
  id: string;
  [key: string]: any; // Dynamic fields based on FieldDefinition
}

export interface CertificateTemplate {
  id: string;
  imageUrl: string;
  imageFile?: File;
  textBoxes: TextBox[];
  fields: FieldDefinition[];
}

export interface CertificateData {
  template: CertificateTemplate;
  members: Member[];
  generatedAt: string;
}

