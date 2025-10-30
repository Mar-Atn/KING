/**
 * AI Character Prototype - Main Entry Point
 *
 * Metacognitive 4-Block System for The New King SIM
 *
 * @packageDocumentation
 */

// Core exports
export * from './types/ai-context';
export * from './types/conversation';
export * from './types/prompts';

// Character initialization
export { initializeCharacter } from './core/character-init';
export { buildSystemPrompt } from './core/system-prompt';

// Conversation management
export { CharacterConversation } from './conversation/text-conversation';
export { VoiceConversation } from './conversation/voice-conversation';

// Reflection engine
export { triggerReflection } from './reflection/reflection-engine';

// Database operations
export * from './database/ai-context-db';
export * from './database/prompts-db';
export * from './database/conversations-db';

// Utilities
export { parseAIResponse } from './utils/json-parser';
export { countWords } from './utils/word-counter';
export { logger } from './utils/logger';

// Version
export const VERSION = '0.1.0';
