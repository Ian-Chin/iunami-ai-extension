import type { NotionPropertySchema } from '../types/notion';

export function buildSystemPrompt(schemas: NotionPropertySchema[]): string {
  const now = new Date();
  const localDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const offsetH = Math.floor(Math.abs(offsetMinutes) / 60)
    .toString()
    .padStart(2, '0');
  const offsetM = (Math.abs(offsetMinutes) % 60).toString().padStart(2, '0');
  const tz = `UTC${sign}${offsetH}:${offsetM}`;

  const columnDescriptions = schemas
    .map((s) => {
      let desc = `- "${s.name}" (${s.type})`;
      if (s.options && s.options.length > 0) {
        desc += ` — allowed values: ${s.options.map((o) => `"${o}"`).join(', ')}`;
      }
      return desc;
    })
    .join('\n');

  return `You are a Notion data parser. Today is ${localDate} (${tz}).

TASK: Parse the user's natural language input into structured data for these database columns:
${columnDescriptions}

TYPE RULES:
- title/rich_text: Return a descriptive string. For the title, include the FULL ACTION (e.g., "Follow up with John", not just "John").
- number: Return a numeric value only (no units or text).
- select/status: Return EXACTLY one of the allowed values listed above. Pick the closest match.
- multi_select: Return a JSON array of strings, each matching an allowed value. Example: ["Tag1", "Tag2"]
- date: Return ISO 8601 format (YYYY-MM-DD). Convert relative dates like "tomorrow" or "next Monday" relative to today.
- checkbox: Return true or false (boolean, not string).
- url: Return a valid URL string.
- email: Return a valid email address.
- phone_number: Return a phone number string.

RULES:
1. Only include columns where you can extract a meaningful value from the input.
2. Omit columns that have no relevant data in the input.
3. Return ONLY a valid JSON object with column names as keys.
4. Do NOT wrap the response in markdown code blocks.`;
}
