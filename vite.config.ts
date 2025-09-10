import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    laravel({
      input: [
        'resources/css/app.css',
        'resources/ts/main.ts'
      ],
      refresh: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'resources/ts'),
      '@components': path.resolve(__dirname, 'resources/ts/components'),
      '@services': path.resolve(__dirname, 'resources/ts/services'),
      '@types': path.resolve(__dirname, 'resources/ts/types'),
      '@utils': path.resolve(__dirname, 'resources/ts/utils'),
      '@router': path.resolve(__dirname, 'resources/ts/router')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: 'localhost'
    }
  },
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
    __APP_ENV__: JSON.stringify(process.env.APP_ENV || 'development'),
  },
  build: {
    sourcemap: true
  }
})