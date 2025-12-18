/**
 * Janus Error Handling Utilities
 * Provides consistent error handling, validation, and user-friendly error messages
 */

import { z } from 'zod';
import chalk from 'chalk';

// =============================================================================
// Custom Error Classes
// =============================================================================

/**
 * Base error class for all Janus-specific errors
 */
export class JanusError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly suggestion?: string
  ) {
    super(message);
    this.name = 'JanusError';
  }
}

/**
 * Error thrown when configuration is invalid or missing
 */
export class ConfigurationError extends JanusError {
  constructor(message: string, suggestion?: string) {
    super(message, 'CONFIG_ERROR', suggestion);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error thrown when file operations fail
 */
export class FileOperationError extends JanusError {
  constructor(
    message: string,
    public readonly filePath: string,
    suggestion?: string
  ) {
    super(message, 'FILE_ERROR', suggestion);
    this.name = 'FileOperationError';
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends JanusError {
  constructor(message: string, suggestion?: string) {
    super(message, 'VALIDATION_ERROR', suggestion);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when API operations fail
 */
export class ApiError extends JanusError {
  constructor(
    message: string,
    public readonly provider: string,
    suggestion?: string
  ) {
    super(message, 'API_ERROR', suggestion);
    this.name = 'ApiError';
  }
}

// =============================================================================
// Zod Validation Schemas
// =============================================================================

/**
 * Schema for CurrentFocus - validates structure from JSON files
 */
export const CurrentFocusSchema = z.object({
  objective: z.string().min(1, 'Objective cannot be empty'),
  phase: z.string().min(1, 'Phase cannot be empty'),
  blockers: z.array(z.string()).default([]),
  nextActions: z.array(z.string()).default([]),
  lastUpdated: z.string().optional(),
});

/**
 * Schema for Task validation
 */
export const TaskSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  assignedTo: z.enum(['scout-swarm', 'executor-swarm', 'council']),
  status: z.enum(['pending', 'active', 'blocked', 'complete', 'failed']),
  context: z.string(),
  dependencies: z.array(z.string()),
  artifacts: z.array(z.string()),
  result: z.string().optional(),
  error: z.string().optional(),
});

/**
 * Schema for Deliberation validation
 */
export const DeliberationSchema = z.object({
  id: z.string().min(1),
  task: z.string().min(1),
  proposals: z.array(z.any()),
  disagreements: z.array(z.any()),
  consensus: z.string().nullable(),
  synthesizedAnswer: z.string().optional(),
  totalTokens: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  timestamp: z.string(),
});

// =============================================================================
// Input Validation Functions
// =============================================================================

/**
 * Validates a CLI task argument
 * @throws ValidationError if task is invalid
 */
export function validateTaskInput(task: string): string {
  const trimmed = task.trim();

  if (!trimmed) {
    throw new ValidationError(
      'Task cannot be empty or whitespace-only',
      'Provide a meaningful task description, e.g.: janus council "Review authentication flow"'
    );
  }

  if (trimmed.length < 3) {
    throw new ValidationError(
      'Task is too short (minimum 3 characters)',
      'Provide a more descriptive task'
    );
  }

  if (trimmed.length > 10000) {
    throw new ValidationError(
      'Task is too long (maximum 10000 characters)',
      'Break down the task into smaller pieces or reference external documentation'
    );
  }

  return trimmed;
}

/**
 * Validates a CLI query argument
 * @throws ValidationError if query is invalid
 */
export function validateQueryInput(query: string): string {
  const trimmed = query.trim();

  if (!trimmed) {
    throw new ValidationError(
      'Query cannot be empty or whitespace-only',
      'Provide a search query, e.g.: janus scout "typescript http client libraries"'
    );
  }

  if (trimmed.length < 2) {
    throw new ValidationError(
      'Query is too short (minimum 2 characters)',
      'Provide a more descriptive search query'
    );
  }

  if (trimmed.length > 1000) {
    throw new ValidationError(
      'Query is too long (maximum 1000 characters)',
      'Simplify your search query'
    );
  }

  return trimmed;
}

/**
 * Validates an output file path
 * @throws ValidationError if path is invalid
 */
export function validateOutputPath(filePath: string): string {
  const trimmed = filePath.trim();

  if (!trimmed) {
    throw new ValidationError(
      'Output file path cannot be empty',
      'Provide a valid file path, e.g.: -o results.json'
    );
  }

  // Check for potentially dangerous path components
  if (trimmed.includes('\0')) {
    throw new ValidationError(
      'Invalid characters in file path',
      'File paths cannot contain null bytes'
    );
  }

  return trimmed;
}

// =============================================================================
// Environment Validation
// =============================================================================

export interface ApiKeyStatus {
  anthropic: boolean;
  openai: boolean;
  google: boolean;
  anyConfigured: boolean;
  allConfigured: boolean;
}

/**
 * Validates and returns status of API key configuration
 */
export function validateApiKeys(): ApiKeyStatus {
  const anthropic = isValidApiKey(process.env.ANTHROPIC_API_KEY);
  const openai = isValidApiKey(process.env.OPENAI_API_KEY);
  const google = isValidApiKey(process.env.GOOGLE_API_KEY);

  return {
    anthropic,
    openai,
    google,
    anyConfigured: anthropic || openai || google,
    allConfigured: anthropic && openai && google,
  };
}

/**
 * Checks if an API key string is valid (not empty, has minimum length)
 */
function isValidApiKey(key: string | undefined): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  // Most API keys are at least 20 characters
  return trimmed.length >= 10;
}

/**
 * Validates that required API keys are present for a specific operation
 * @throws ConfigurationError if required keys are missing
 */
export function requireApiKeys(
  required: ('anthropic' | 'openai' | 'google')[],
  operation: string
): void {
  const status = validateApiKeys();
  const missing: string[] = [];

  for (const key of required) {
    if (!status[key]) {
      missing.push(key.toUpperCase());
    }
  }

  if (missing.length > 0) {
    throw new ConfigurationError(
      `Missing API key(s) for ${operation}: ${missing.join(', ')}`,
      `Configure the following in your .env file:\n${missing.map(k => `  ${k}_API_KEY=your-key-here`).join('\n')}`
    );
  }
}

/**
 * Validates the context root path configuration
 * @throws ConfigurationError if path is invalid
 */
export function validateContextRoot(path: string): string {
  if (!path || !path.trim()) {
    throw new ConfigurationError(
      'JANUS_CONTEXT_ROOT is empty',
      'Set JANUS_CONTEXT_ROOT in your environment or .env file'
    );
  }

  // Normalize the path
  const normalized = path.trim();

  // Check for potentially dangerous patterns
  if (normalized.includes('\0')) {
    throw new ConfigurationError(
      'JANUS_CONTEXT_ROOT contains invalid characters',
      'Remove null bytes from the path'
    );
  }

  return normalized;
}

// =============================================================================
// Error Formatting and Display
// =============================================================================

/**
 * Formats an error for display to the user
 */
export function formatError(error: unknown): string {
  if (error instanceof JanusError) {
    let message = chalk.red(`Error: ${error.message}`);
    if (error.suggestion) {
      message += '\n' + chalk.yellow(`Suggestion: ${error.suggestion}`);
    }
    return message;
  }

  if (error instanceof z.ZodError) {
    const issues = error.issues.map(issue => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `  - ${path}${issue.message}`;
    }).join('\n');
    return chalk.red('Validation error:\n') + issues;
  }

  if (error instanceof Error) {
    return chalk.red(`Error: ${error.message}`);
  }

  return chalk.red(`Unknown error: ${String(error)}`);
}

/**
 * Handles errors consistently across all commands
 * @param error - The error that occurred
 * @param _context - Context string for logging (reserved for future use)
 */
export function handleCommandError(error: unknown, _context: string): void {
  console.error('\n' + formatError(error));

  // Log additional debug info for non-Janus errors
  if (!(error instanceof JanusError) && error instanceof Error) {
    if (process.env.JANUS_DEBUG === 'true') {
      console.error(chalk.dim('\nStack trace:'));
      console.error(chalk.dim(error.stack));
    } else {
      console.error(chalk.dim('\nSet JANUS_DEBUG=true for more details.'));
    }
  }

  // Exit with error code for non-interactive use
  process.exitCode = 1;
}

// =============================================================================
// File Operation Helpers
// =============================================================================

/**
 * Wraps file read operations with proper error handling
 */
export async function safeReadFile(
  filePath: string,
  readFn: (path: string, encoding: BufferEncoding) => Promise<string>
): Promise<string> {
  try {
    return await readFn(filePath, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      const nodeError = error as NodeJS.ErrnoException;

      switch (nodeError.code) {
        case 'ENOENT':
          throw new FileOperationError(
            `File not found: ${filePath}`,
            filePath,
            'Check that the file exists and the path is correct'
          );
        case 'EACCES':
          throw new FileOperationError(
            `Permission denied: ${filePath}`,
            filePath,
            'Check file permissions or run with appropriate privileges'
          );
        case 'EISDIR':
          throw new FileOperationError(
            `Path is a directory, not a file: ${filePath}`,
            filePath,
            'Provide a path to a file, not a directory'
          );
        case 'EMFILE':
          throw new FileOperationError(
            'Too many open files',
            filePath,
            'Close some files or increase the file descriptor limit'
          );
        default:
          throw new FileOperationError(
            `Failed to read file: ${nodeError.message}`,
            filePath
          );
      }
    }
    throw error;
  }
}

/**
 * Wraps file write operations with proper error handling
 */
export async function safeWriteFile(
  filePath: string,
  content: string,
  writeFn: (path: string, content: string) => Promise<void>
): Promise<void> {
  try {
    await writeFn(filePath, content);
  } catch (error) {
    if (error instanceof Error) {
      const nodeError = error as NodeJS.ErrnoException;

      switch (nodeError.code) {
        case 'ENOENT':
          throw new FileOperationError(
            `Directory does not exist for: ${filePath}`,
            filePath,
            'Create the parent directory first or run: janus init'
          );
        case 'EACCES':
          throw new FileOperationError(
            `Permission denied: ${filePath}`,
            filePath,
            'Check file permissions or run with appropriate privileges'
          );
        case 'ENOSPC':
          throw new FileOperationError(
            'No space left on device',
            filePath,
            'Free up disk space and try again'
          );
        case 'EROFS':
          throw new FileOperationError(
            'Read-only file system',
            filePath,
            'The file system is mounted read-only'
          );
        default:
          throw new FileOperationError(
            `Failed to write file: ${nodeError.message}`,
            filePath
          );
      }
    }
    throw error;
  }
}

/**
 * Safely parses JSON with validation
 */
export function safeJsonParse<T>(
  content: string,
  schema: z.ZodSchema<T>,
  filePath?: string
): T {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    throw new ValidationError(
      `Invalid JSON${filePath ? ` in ${filePath}` : ''}: ${message}`,
      'Check the file for syntax errors (missing commas, brackets, etc.)'
    );
  }

  const result = schema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues.map(i =>
      `${i.path.join('.')}: ${i.message}`
    ).join('; ');
    throw new ValidationError(
      `Invalid data structure${filePath ? ` in ${filePath}` : ''}: ${issues}`,
      'Check that the file matches the expected format'
    );
  }

  return result.data;
}

// =============================================================================
// Global Error Handler
// =============================================================================

/**
 * Sets up global error handlers for unhandled rejections and exceptions
 */
export function setupGlobalErrorHandlers(): void {
  process.on('unhandledRejection', (reason: unknown) => {
    console.error(chalk.red('\nUnhandled promise rejection:'));
    console.error(formatError(reason));
    process.exitCode = 1;
  });

  process.on('uncaughtException', (error: Error) => {
    console.error(chalk.red('\nUncaught exception:'));
    console.error(formatError(error));
    process.exit(1);
  });
}
