export const SUPPORTED_PROPERTY_TYPES = [
  'title',
  'rich_text',
  'number',
  'select',
  'multi_select',
  'date',
  'checkbox',
  'url',
  'email',
  'phone_number',
  'status',
] as const;

export type SupportedPropertyType = (typeof SUPPORTED_PROPERTY_TYPES)[number];

export interface NotionPropertySchema {
  name: string;
  type: SupportedPropertyType;
  options?: string[];
}

export type PropertyValue = string | number | boolean | string[];

export type PropertyValueMap = Record<string, PropertyValue>;
