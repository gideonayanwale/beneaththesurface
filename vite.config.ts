import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [],
    server: {
        port: 3000,
    },
    base: './', // For itch.io relative paths
    build: {
        assetsInlineLimit: 0, // Keep assets separate for easier management unless requested
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        }
    }
});
