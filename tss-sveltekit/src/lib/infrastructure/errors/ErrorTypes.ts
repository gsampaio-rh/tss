/**
 * Error types for the application
 */

export enum ErrorSeverity {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	CRITICAL = 'critical'
}

export enum ErrorCategory {
	VALIDATION = 'validation',
	NETWORK = 'network',
	STORAGE = 'storage',
	RUNTIME = 'runtime',
	DOMAIN = 'domain',
	APPLICATION = 'application',
	UNKNOWN = 'unknown'
}

export interface AppError extends Error {
	severity: ErrorSeverity;
	category: ErrorCategory;
	code?: string;
	timestamp: Date;
	context?: Record<string, unknown>;
	originalError?: Error;
}

export class ValidationError extends Error implements AppError {
	severity = ErrorSeverity.MEDIUM;
	category = ErrorCategory.VALIDATION;
	timestamp: Date;
	context?: Record<string, unknown>;

	constructor(message: string, context?: Record<string, unknown>) {
		super(message);
		this.name = 'ValidationError';
		this.timestamp = new Date();
		this.context = context;
	}
}

export class StorageError extends Error implements AppError {
	severity = ErrorSeverity.HIGH;
	category = ErrorCategory.STORAGE;
	timestamp: Date;
	context?: Record<string, unknown>;
	originalError?: Error;

	constructor(message: string, originalError?: Error, context?: Record<string, unknown>) {
		super(message);
		this.name = 'StorageError';
		this.timestamp = new Date();
		this.originalError = originalError;
		this.context = context;
	}
}

export class DomainError extends Error implements AppError {
	severity = ErrorSeverity.HIGH;
	category = ErrorCategory.DOMAIN;
	timestamp: Date;
	context?: Record<string, unknown>;

	constructor(message: string, context?: Record<string, unknown>) {
		super(message);
		this.name = 'DomainError';
		this.timestamp = new Date();
		this.context = context;
	}
}

export class ApplicationError extends Error implements AppError {
	severity = ErrorSeverity.MEDIUM;
	category = ErrorCategory.APPLICATION;
	timestamp: Date;
	context?: Record<string, unknown>;
	originalError?: Error;

	constructor(message: string, originalError?: Error, context?: Record<string, unknown>) {
		super(message);
		this.name = 'ApplicationError';
		this.timestamp = new Date();
		this.originalError = originalError;
		this.context = context;
	}
}

