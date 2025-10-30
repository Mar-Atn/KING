/**
 * Word Counter
 *
 * Validates memory size constraints (≤2500 words)
 */

import { logger } from './logger';

/**
 * Count words in text or JSON object
 */
export function countWords(input: string | object): number {
  let text: string;

  if (typeof input === 'object') {
    // Convert JSON to string
    text = JSON.stringify(input, null, 2);
  } else {
    text = input;
  }

  // Split on whitespace and filter empty strings
  const words = text.split(/\s+/).filter(word => word.length > 0);

  return words.length;
}

/**
 * Validate that memory is within limit
 */
export function validateMemorySize(
  memory: object,
  maxWords: number = 2500
): { valid: boolean; wordCount: number; message?: string } {
  const wordCount = countWords(memory);

  logger.debug('WORD_COUNTER', 'Counted words in memory', { wordCount, maxWords });

  if (wordCount <= maxWords) {
    return { valid: true, wordCount };
  } else {
    const message = `Memory exceeds limit: ${wordCount} words > ${maxWords} words`;
    logger.warn('WORD_COUNTER', message);
    return { valid: false, wordCount, message };
  }
}

/**
 * Calculate percentage of memory used
 */
export function memoryUsagePercentage(
  memory: object,
  maxWords: number = 2500
): number {
  const wordCount = countWords(memory);
  return Math.round((wordCount / maxWords) * 100);
}
