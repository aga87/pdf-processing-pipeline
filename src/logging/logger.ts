/* eslint-disable no-console */

// Minimal logger - in Cloud Run everything written to the console is captured and sent to Cloud Logging
export const logger = {
  info: (message: string, meta?: Record<string, unknown>): void => {
    console.log(JSON.stringify({ severity: 'INFO', message, ...meta }));
  },

  warn: (message: string, meta?: Record<string, unknown>): void => {
    console.warn(JSON.stringify({ severity: 'WARNING', message, ...meta }));
  },

  error: (message: string, meta?: Record<string, unknown>): void => {
    console.error(JSON.stringify({ severity: 'ERROR', message, ...meta }));
  },
};
