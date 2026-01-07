// src/lib/logger.ts - Fixed version with string concatenation
import pino from 'pino';

// Simple logger configuration that works in serverless
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['password', 'token', 'authorization', 'cookie', 'email'],
    censor: '**REDACTED**'
  },
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    }
  },
  timestamp: () => ',time:' + new Date().toISOString(),
  messageKey: 'message'
});

// Simple logger methods that don't use worker threads
export const Logger = {
  info: (message: string, data?: Record<string, unknown>, context?: string) => {
    const logData: Record<string, unknown> = { ...data };
    if (context) logData.context = context;
    logger.info(logData, message);
  },
  
   error: (message: string, error?: unknown, context?: string) => {
    const logData: Record<string, unknown> = {};
    if (context) logData.context = context;
    
    if (error instanceof Error) {
      const errorData: Record<string, unknown> = {
        message: error.message,
        name: error.name
      };
      // Only include stack in development
      if (process.env.NODE_ENV !== 'production') {
        errorData.stack = error.stack;
      }
      logData.err = errorData;
    } else if (error) {
      logData.err = error;
    }
    
    logger.error(logData, message);
  },
  
  warn: (message: string, data?: Record<string, unknown>, context?: string) => {
    const logData: Record<string, unknown> = { ...data };
    if (context) logData.context = context;
    logger.warn(logData, message);
  },
  
  debug: (message: string, data?: Record<string, unknown>, context?: string) => {
    const logData: Record<string, unknown> = { ...data };
    if (context) logData.context = context;
    logger.debug(logData, message);
  }
};

// Simple request ID generator
export function generateRequestId(): string {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Simple child logger creator
export function createLogger(context: string, requestId?: string) {
  const childConfig: Record<string, unknown> = { context };
  if (requestId) childConfig.requestId = requestId;
  return logger.child(childConfig);
}

export default logger;
