import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Run tests in Node environment (not browser)
        environment: 'node',
        // Include test files
        include: ['tests/**/*.test.js'],
        // Allow importing from src/ with proper resolution
        alias: {
            '@': '/src'
        },
        // Timeout for individual tests
        testTimeout: 10000
    }
});
