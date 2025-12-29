/**
 * Centralized logging service
 * Provides structured logging with different log levels
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	NONE = 4
}

export interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: Date;
	category?: string;
	context?: Record<string, unknown>;
	error?: Error;
}

type LogHandler = (entry: LogEntry) => void;

class Logger {
	private level: LogLevel = LogLevel.INFO;
	private handlers: LogHandler[] = [];

	constructor() {
		// Set log level from environment or default to INFO
		const envLevel = import.meta.env.VITE_LOG_LEVEL;
		if (envLevel) {
			this.level = this.parseLogLevel(envLevel);
		}

		// Add console handler by default
		this.addHandler(this.consoleHandler.bind(this));
	}

	private parseLogLevel(level: string): LogLevel {
		const upperLevel = level.toUpperCase();
		switch (upperLevel) {
			case 'DEBUG':
				return LogLevel.DEBUG;
			case 'INFO':
				return LogLevel.INFO;
			case 'WARN':
				return LogLevel.WARN;
			case 'ERROR':
				return LogLevel.ERROR;
			case 'NONE':
				return LogLevel.NONE;
			default:
				return LogLevel.INFO;
		}
	}

	setLevel(level: LogLevel): void {
		this.level = level;
	}

	addHandler(handler: LogHandler): void {
		this.handlers.push(handler);
	}

	private shouldLog(level: LogLevel): boolean {
		return level >= this.level;
	}

	private log(
		level: LogLevel,
		message: string,
		category?: string,
		context?: Record<string, unknown>,
		error?: Error
	): void {
		if (!this.shouldLog(level)) {
			return;
		}

		const entry: LogEntry = {
			level,
			message,
			timestamp: new Date(),
			category,
			context,
			error
		};

		this.handlers.forEach(handler => {
			try {
				handler(entry);
			} catch (err) {
				// Prevent logging errors from breaking the app
				console.error('Log handler error:', err);
			}
		});
	}

	private consoleHandler(entry: LogEntry): void {
		const timestamp = entry.timestamp.toISOString();
		const category = entry.category ? `[${entry.category}]` : '';
		const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
		const errorStr = entry.error ? `\n${entry.error.stack || entry.error.message}` : '';

		const logMessage = `${timestamp} ${category} ${entry.message}${contextStr}${errorStr}`;

		switch (entry.level) {
			case LogLevel.DEBUG:
				console.debug(logMessage);
				break;
			case LogLevel.INFO:
				console.info(logMessage);
				break;
			case LogLevel.WARN:
				console.warn(logMessage);
				break;
			case LogLevel.ERROR:
				console.error(logMessage);
				break;
		}
	}

	debug(message: string, category?: string, context?: Record<string, unknown>): void {
		this.log(LogLevel.DEBUG, message, category, context);
	}

	info(message: string, category?: string, context?: Record<string, unknown>): void {
		this.log(LogLevel.INFO, message, category, context);
	}

	warn(message: string, category?: string, context?: Record<string, unknown>): void {
		this.log(LogLevel.WARN, message, category, context);
	}

	error(
		message: string,
		error?: Error,
		category?: string,
		context?: Record<string, unknown>
	): void {
		this.log(LogLevel.ERROR, message, category, context, error);
	}
}

// Singleton instance
export const logger = new Logger();

// Convenience functions
export const logDebug = (message: string, category?: string, context?: Record<string, unknown>) => {
	logger.debug(message, category, context);
};

export const logInfo = (message: string, category?: string, context?: Record<string, unknown>) => {
	logger.info(message, category, context);
};

export const logWarn = (message: string, category?: string, context?: Record<string, unknown>) => {
	logger.warn(message, category, context);
};

export const logError = (
	message: string,
	error?: Error,
	category?: string,
	context?: Record<string, unknown>
) => {
	logger.error(message, error, category, context);
};

