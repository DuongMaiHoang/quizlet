/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
    },
    resolve: {
        alias: {
            '@/ui': resolve(process.cwd(), './src/ui'),
            '@/lib': resolve(process.cwd(), './src/lib'),
            '@/application': resolve(process.cwd(), './src/application'),
            '@': resolve(process.cwd(), './'),
        },
    },
});
