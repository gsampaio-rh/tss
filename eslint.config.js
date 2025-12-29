import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import svelteParser from 'svelte-eslint-parser';

export default [
	// Base JavaScript rules
	js.configs.recommended,

	// Global ignores
	{
		ignores: [
			'node_modules/**',
			'.svelte-kit/**',
			'build/**',
			'dist/**',
			'*.min.js',
			'*.min.css',
			'vite.config.ts',
			'svelte.config.js',
			'eslint.config.js'
		]
	},

	// TypeScript files
	{
		files: ['**/*.ts'],
		ignores: ['eslint.config.js', '*.config.js'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 2020,
				project: ['./tsconfig.json']
			},
			globals: {
				document: 'readonly',
				window: 'readonly',
				console: 'readonly',
				HTMLElement: 'readonly',
				SVGElement: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			prettier: prettier
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			...tsPlugin.configs['recommended-type-checked'].rules,
			...prettierConfig.rules,
			'prettier/prettier': 'error',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_'
				}
			],
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/no-unsafe-assignment': 'warn',
			'@typescript-eslint/no-unsafe-member-access': 'warn',
			'@typescript-eslint/no-unsafe-call': 'warn',
			'@typescript-eslint/no-unsafe-return': 'warn',
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'no-debugger': 'error',
			'no-alert': 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			'prefer-arrow-callback': 'error',
			'no-throw-literal': 'error',
			'no-unused-expressions': 'error'
		}
	},

	// Svelte files
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser
			}
		},
		plugins: {
			svelte: sveltePlugin,
			'@typescript-eslint': tsPlugin,
			prettier: prettier
		},
		rules: {
			...sveltePlugin.configs.recommended.rules,
			...prettierConfig.rules,
			'prettier/prettier': 'error',
			'svelte/no-at-html-tags': 'warn',
			'svelte/valid-compile': 'error'
		}
	}
];
