/**
 * useForm Hook
 * Provides form state and validation management
 */

import { writable } from 'svelte/store';

export interface FormField<T = unknown> {
	value: T;
	error?: string;
	touched: boolean;
	dirty: boolean;
}

export interface UseFormReturn<T extends Record<string, unknown>> {
	fields: {
		subscribe: (callback: (value: Record<keyof T, FormField>) => void) => () => void;
	};
	setValue: <K extends keyof T>(field: K, value: T[K]) => void;
	setError: <K extends keyof T>(field: K, error: string | undefined) => void;
	setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
	reset: () => void;
	validate: () => boolean;
	getValues: () => T;
}

/**
 * Hook for managing form state
 */
export function useForm<T extends Record<string, unknown>>(
	initialValues: T,
	validator?: (values: T) => Partial<Record<keyof T, string>>
): UseFormReturn<T> {
	const initialFields: Record<keyof T, FormField> = {} as Record<keyof T, FormField>;
	
	for (const key in initialValues) {
		initialFields[key] = {
			value: initialValues[key],
			error: undefined,
			touched: false,
			dirty: false
		};
	}

	const fields = writable<Record<keyof T, FormField>>(initialFields);

	function setValue<K extends keyof T>(field: K, value: T[K]): void {
		fields.update(current => {
			const fieldData = current[field];
			return {
				...current,
				[field]: {
					...fieldData,
					value,
					dirty: fieldData.value !== value
				}
			};
		});
	}

	function setError<K extends keyof T>(field: K, error: string | undefined): void {
		fields.update(current => ({
			...current,
			[field]: {
				...current[field],
				error
			}
		}));
	}

	function setTouched<K extends keyof T>(field: K, touched: boolean = true): void {
		fields.update(current => ({
			...current,
			[field]: {
				...current[field],
				touched
			}
		}));
	}

	function reset(): void {
		fields.set(initialFields);
	}

	function validate(): boolean {
		if (!validator) return true;

		fields.update(current => {
			const values = {} as T;
			for (const key in current) {
				values[key] = current[key].value as T[typeof key];
			}

			const errors = validator(values);
			const updated = { ...current };

			for (const key in current) {
				updated[key] = {
					...current[key],
					error: errors[key],
					touched: true
				};
			}

			return updated;
		});

		// Check if there are any errors
		let hasErrors = false;
		fields.subscribe(current => {
			for (const key in current) {
				if (current[key].error) {
					hasErrors = true;
				}
			}
		})();

		return !hasErrors;
	}

	function getValues(): T {
		let values = {} as T;
		fields.subscribe(current => {
			for (const key in current) {
				values[key] = current[key].value as T[typeof key];
			}
		})();
		return values;
	}

	return {
		fields: {
			subscribe: fields.subscribe
		},
		setValue,
		setError,
		setTouched,
		reset,
		validate,
		getValues
	};
}

