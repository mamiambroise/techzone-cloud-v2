import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, mergeConfig } from 'vite';
import { configDefaults } from 'vitest/config';

const commonConfig = {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
};

export default defineConfig(({ mode }) => {
  if (mode === 'test') {
    return mergeConfig(commonConfig, {
      test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: ['./src/tests/setup.js'],
        include: ['src/**/*.test.{js,jsx}'],
        exclude: [...configDefaults.exclude, 'node_modules/*'],
        css: true,
        mockReset: true,
      },
    });
  }

  return {
    ...commonConfig,
    server: {
      port: 3000,
      proxy: {
        '/api/iam': {
          target: 'http://localhost:3003',
          changeOrigin: true,
        },
        '/api': {
          target: 'http://localhost:3003',
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
