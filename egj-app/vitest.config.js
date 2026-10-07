import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Separate from vite.config.js so the Laravel plugin (build/HMR) is not loaded during tests.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/__tests__/setup.js'],
        include: ['resources/js/**/*.test.{js,jsx}'],
        restoreMocks: true,
        // The default "forks" pool fails to start workers on this Windows setup
        pool: 'threads',
    },
});
