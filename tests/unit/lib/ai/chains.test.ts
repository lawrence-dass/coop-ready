/**
 * Tests for LCEL chain utilities
 */

import { describe, it, expect } from 'vitest';
import { createJsonParser } from '@/lib/ai/chains';
import { AIMessage } from '@langchain/core/messages';

describe('createJsonParser', () => {
  it('should parse clean JSON', async () => {
    const parser = createJsonParser<{ name: string; age: number }>();
    const message = new AIMessage('{"name": "John", "age": 30}');

    const result = await parser.invoke(message);

    expect(result).toEqual({ name: 'John', age: 30 });
  });

  it('should parse JSON wrapped in markdown code blocks', async () => {
    const parser = createJsonParser<{ name: string }>();
    const message = new AIMessage('```json\n{"name": "Alice"}\n```');

    const result = await parser.invoke(message);

    expect(result).toEqual({ name: 'Alice' });
  });

  it('should parse JSON with trailing text', async () => {
    const parser = createJsonParser<{ degree: { level: string; field: string } }>();
    const message = new AIMessage(
      '{"degree": {"level": "bachelor", "field": "Computer Science"}}Note: This candidate has great qualifications.'
    );

    const result = await parser.invoke(message);

    expect(result).toEqual({
      degree: { level: 'bachelor', field: 'Computer Science' },
    });
  });

  it('should parse JSON with leading text', async () => {
    const parser = createJsonParser<{ certifications: string[] }>();
    const message = new AIMessage(
      'Here are the certifications:\n{"certifications": ["AWS", "Azure"]}'
    );

    const result = await parser.invoke(message);

    expect(result).toEqual({ certifications: ['AWS', 'Azure'] });
  });

  it('should handle arrays', async () => {
    const parser = createJsonParser<string[]>();
    const message = new AIMessage('["item1", "item2", "item3"]');

    const result = await parser.invoke(message);

    expect(result).toEqual(['item1', 'item2', 'item3']);
  });

  it('should handle nested objects', async () => {
    const parser = createJsonParser<{
      degreeRequired: { level: string; fields: string[]; required: boolean };
    }>();
    const message = new AIMessage(
      '{"degreeRequired": {"level": "bachelor", "fields": ["CS", "Engineering"], "required": true}}'
    );

    const result = await parser.invoke(message);

    expect(result).toEqual({
      degreeRequired: {
        level: 'bachelor',
        fields: ['CS', 'Engineering'],
        required: true,
      },
    });
  });

  it('should throw on invalid JSON', async () => {
    const parser = createJsonParser<{ name: string }>();
    const message = new AIMessage('This is not JSON at all');

    await expect(parser.invoke(message)).rejects.toThrow();
  });
});
