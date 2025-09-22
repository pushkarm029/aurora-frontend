import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import path from "path";
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    }),

    // Progressive Web App configuration
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Aurora Language Assistant',
        short_name: 'Aurora',
        description: 'AI-powered language learning platform',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        display: 'standalone',
        icons: [
          {
            src: '/aurora-logo.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    }),

    // Bundle analyzer in development
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    }
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: false
    }
  },

  // Preview server configuration
  preview: {
    port: 4173,
    open: true
  },

  // Build configuration
  build: {
    // Output directory
    outDir: 'dist',

    // Generate source maps for debugging
    sourcemap: process.env.NODE_ENV === 'development',

    // Minification
    minify: 'terser',

    // Terser options for optimal compression
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },

    // Rollup options
    rollupOptions: {
      // External dependencies (won't be bundled)
      external: [],

      output: {
        // Manual chunking strategy
        manualChunks: (id) => {
          // Node modules chunking
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }

            // UI Libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('react-icons')) {
              return 'ui-vendor';
            }

            // Blockchain libraries
            if (id.includes('stellar') || id.includes('starknet') || id.includes('wallet')) {
              return 'blockchain-vendor';
            }

            // Animation libraries
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }

            // Form libraries
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'form-vendor';
            }

            // Testing libraries
            if (id.includes('@testing-library') || id.includes('jest')) {
              return 'test-vendor';
            }

            // Utility libraries
            if (id.includes('axios') || id.includes('clsx') || id.includes('uuid') || id.includes('buffer')) {
              return 'utils-vendor';
            }

            // Default vendor chunk for other node_modules
            return 'vendor';
          }

          // App code chunking
          if (id.includes('src/pages/games/')) {
            return 'games-chunk';
          }

          if (id.includes('src/components/games/') || id.includes('src/components/Games/')) {
            return 'games-components';
          }

          if (id.includes('src/pages/aurora-site/learning/')) {
            return 'learning-chunk';
          }

          if (id.includes('src/components/practices/')) {
            return 'practice-chunk';
          }

          if (id.includes('src/components/stellar/')) {
            return 'blockchain-components';
          }

          if (id.includes('src/pages/auth/')) {
            return 'auth-chunk';
          }
        },

        // Naming patterns for chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId;

          if (facadeModuleId && facadeModuleId.includes('node_modules')) {
            return 'vendor/[name]-[hash].js';
          }

          if (facadeModuleId && facadeModuleId.includes('src/pages/')) {
            return 'pages/[name]-[hash].js';
          }

          if (facadeModuleId && facadeModuleId.includes('src/components/')) {
            return 'components/[name]-[hash].js';
          }

          return 'chunks/[name]-[hash].js';
        },

        // Entry file naming
        entryFileNames: 'assets/[name]-[hash].js',

        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];

          if (/\.(css)$/.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash].[ext]';
          }

          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash].[ext]';
          }

          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }

          return 'assets/[name]-[hash].[ext]';
        }
      }
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // CSS code splitting
    cssCodeSplit: true,

    // Preload module dependencies
    modulePreload: {
      polyfill: true
    },

    // Asset inline limit (smaller files will be inlined as base64)
    assetsInlineLimit: 4096,

    // Copy public assets
    copyPublicDir: true
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'clsx'
    ],
    exclude: [
      '@stellar/stellar-sdk',
      'starknet',
      'starknetkit'
    ]
  },

  // CSS configuration
  css: {
    // CSS modules
    modules: {
      localsConvention: 'camelCase'
    },

    // PostCSS configuration
    postcss: {
      plugins: []
    },

    // Preprocessor options
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    },

    // CSS code splitting
    devSourcemap: true
  },

  // Performance optimizations
  esbuild: {
    // Tree shaking
    treeShaking: true,

    // Remove unused imports
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,

    // Target modern browsers
    target: 'es2020',

    // JSX optimization
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment'
  },

  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});
