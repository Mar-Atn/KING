/**
 * JSON Response Parser
 *
 * Handles sanitization of AI responses before JSON parsing.
 * GPT-4o often wraps JSON in markdown code blocks.
 */

import { logger } from './logger';

/**
 * Parse AI response, handling markdown code blocks
 */
export function parseAIResponse(rawText: string): any {
  let cleaned = rawText.trim();

  logger.debug('JSON_PARSER', 'Raw response length', { length: cleaned.length });

  // Remove markdown code blocks
  if (cleaned.startsWith('```')) {
    const parts = cleaned.split('```');
    cleaned = parts[1] || parts[0];

    // Remove "json" language identifier
    if (cleaned.startsWith('json')) {
      cleaned = cleaned.substring(4);
    }

    cleaned = cleaned.trim();
    logger.debug('JSON_PARSER', 'Removed markdown code blocks');
  }

  try {
    const parsed = JSON.parse(cleaned);
    logger.debug('JSON_PARSER', 'Successfully parsed JSON');
    return parsed;
  } catch (error) {
    logger.error('JSON_PARSER', 'Failed to parse JSON', {
      error: error instanceof Error ? error.message : String(error),
      rawText: cleaned.substring(0, 200) + '...'
    });
    throw new Error(`Failed to parse AI response as JSON: ${error}`);
  }
}

/**
 * Validate that parsed object has required fields
 */
export function validateAIResponse<T>(
  parsed: any,
  requiredFields: (keyof T)[]
): T {
  const missing = requiredFields.filter(field => !(field in parsed));

  if (missing.length > 0) {
    logger.error('JSON_PARSER', 'Missing required fields', { missing });
    throw new Error(`AI response missing required fields: ${missing.join(', ')}`);
  }

  return parsed as T;
}
