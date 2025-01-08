// src/services/logger.js

export const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

export const logError = (error) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${error.message || error}`);
};