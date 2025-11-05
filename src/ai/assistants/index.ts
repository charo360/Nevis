/**
 * OpenAI Assistants System - Main Exports
 * 
 * This module provides a clean interface to the multi-assistant architecture.
 */

// Core manager
export { AssistantManager, assistantManager } from './assistant-manager';

// Configuration system
export {
  ASSISTANT_CONFIGS,
  getAssistantConfig,
  getImplementedConfigs,
  isAssistantImplemented,
  type AssistantConfig,
} from './assistant-configs';

// Types
export type {
  AssistantContentRequest,
  AssistantContentResponse,
} from './assistant-manager';

