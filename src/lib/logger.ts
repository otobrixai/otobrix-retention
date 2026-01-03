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
  info: (message: string, data?: any, context?: string) => {
    const logData: any = { ...data };
    if (context) logData.context = context;
    logger.info(logData, message);
  },
  
  error: (message: string, error?: any, context?: string) => {
    const logData: any = {};
    if (context) logData.context = context;
    
    if (error instanceof Error) {
      logData.err = {
        message: error.message,
        name: error.name
      };
      // Only include stack in development
      if (process.env.NODE_ENV !== 'production') {
        logData.err.stack = error.stack;
      }
    } else if (error) {
      logData.err = error;
    }
    
    logger.error(logData, message);
  },
  
  warn: (message: string, data?: any, context?: string) => {
    const logData: any = { ...data };
    if (context) logData.context = context;
    logger.warn(logData, message);
  },
  
  debug: (message: string, data?: any, context?: string) => {
    const logData: any = { ...data };
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
  const childConfig: any = { context };
  if (requestId) childConfig.requestId = requestId;
  return logger.child(childConfig);
}

export default logger;
