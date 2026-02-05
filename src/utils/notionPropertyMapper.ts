import {
  SUPPORTED_PROPERTY_TYPES,
  type NotionPropertySchema,
  type PropertyValueMap,
  type SupportedPropertyType,
} from '../types/notion';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Notion API returns untyped property objects; `any` is unavoidable here.

export function parseSchema(
  rawProperties: Record<string, any>
): NotionPropertySchema[] {
  const schemas: NotionPropertySchema[] = [];

  for (const [name, prop] of Object.entries(rawProperties)) {
    if (!SUPPORTED_PROPERTY_TYPES.includes(prop.type as SupportedPropertyType))
      continue;

    const schema: NotionPropertySchema = {
      name,
      type: prop.type as SupportedPropertyType,
    };

    if (prop.type === 'select' && prop.select?.options) {
      schema.options = prop.select.options.map((o: any) => o.name);
    } else if (prop.type === 'multi_select' && prop.multi_select?.options) {
      schema.options = prop.multi_select.options.map((o: any) => o.name);
    } else if (prop.type === 'status' && prop.status?.options) {
      schema.options = prop.status.options.map((o: any) => o.name);
    }

    schemas.push(schema);
  }

  return schemas;
}

export function buildNotionProperties(
  values: PropertyValueMap,
  schemas: NotionPropertySchema[]
): Record<string, any> {
  const properties: Record<string, any> = {};

  for (const schema of schemas) {
    const val = values[schema.name];
    if (val === undefined || val === null || val === '') continue;

    switch (schema.type) {
      case 'title':
        properties[schema.name] = {
          title: [{ text: { content: String(val) } }],
        };
        break;
      case 'rich_text':
        properties[schema.name] = {
          rich_text: [{ text: { content: String(val) } }],
        };
        break;
      case 'number':
        properties[schema.name] = { number: Number(val) };
        break;
      case 'select':
        properties[schema.name] = { select: { name: String(val) } };
        break;
      case 'status':
        properties[schema.name] = { status: { name: String(val) } };
        break;
      case 'multi_select': {
        const items = Array.isArray(val) ? val : [String(val)];
        properties[schema.name] = {
          multi_select: items.map((name) => ({ name: String(name) })),
        };
        break;
      }
      case 'date':
        properties[schema.name] = { date: { start: String(val) } };
        break;
      case 'checkbox':
        properties[schema.name] = {
          checkbox: typeof val === 'boolean' ? val : val === 'true',
        };
        break;
      case 'url':
        properties[schema.name] = { url: String(val) };
        break;
      case 'email':
        properties[schema.name] = { email: String(val) };
        break;
      case 'phone_number':
        properties[schema.name] = { phone_number: String(val) };
        break;
    }
  }

  return properties;
}

export function getUnsupportedFields(
  rawProperties: Record<string, any>
): string[] {
  return Object.entries(rawProperties)
    .filter(
      ([, prop]) =>
        !SUPPORTED_PROPERTY_TYPES.includes(
          prop.type as SupportedPropertyType
        )
    )
    .map(([name]) => name);
}

