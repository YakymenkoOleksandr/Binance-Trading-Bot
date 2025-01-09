// src/services/logger.js

export const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

export const logError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const errorMessage = error.message || error;
  const stackTrace = error.stack ? `\nStack trace:\n${error.stack}` : '';
  console.error(`[${timestamp}] ERROR: ${errorMessage}${context ? ` | Context: ${context}` : ''}${stackTrace}`);
};