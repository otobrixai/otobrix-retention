// src/lib/error-handling.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

// Error handler middleware
export function handleError(error: unknown): { message: string; statusCode: number } {
  console.error('Error:', error);
  
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }
  
  if (error instanceof Error) {
    // Don't expose internal errors in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message;
    
    return {
      message,
      statusCode: 500,
    };
  }
  
  return {
    message: 'Unknown error occurred',
    statusCode: 500,
  };
}

// Database error handler
export function handleDatabaseError(error: unknown): never {
  console.error('Database error:', error);
  
  if (error instanceof Object && 'code' in error) {
    if (error.code === 'P2002') {
      throw new ValidationError('Duplicate entry');
    }
    
    if (error.code === 'P2025') {
      throw new NotFoundError('Record not found');
    }
  }
  
  throw new AppError('Database operation failed', 500);
}