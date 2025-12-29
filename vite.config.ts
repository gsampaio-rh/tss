import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
	plugins: [
		sveltekit(),
		// Serve CSS source maps from node_modules
		{
			name: 'serve-node-modules-sourcemaps',
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					// Handle CSS source map requests (e.g., /bootstrap.css.map)
					if (req.url?.endsWith('.css.map')) {
						try {
							// Try to find the source map in node_modules/bootstrap/dist/css
							const fileName = req.url.split('/').pop() || '';
							const filePath = resolve(
								process.cwd(),
								'node_modules/bootstrap/dist/css',
								fileName
							);
							const content = readFileSync(filePath, 'utf-8');
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.end(content);
							return;
						} catch {
							// If file doesn't exist, return empty source map to prevent 404
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.end(JSON.stringify({ version: 3, sources: [], mappings: '' }));
							return;
						}
					}
					next();
				});
			}
		}
	],
	css: {
		devSourcemap: true
	},
	build: {
		sourcemap: true
	}
});
