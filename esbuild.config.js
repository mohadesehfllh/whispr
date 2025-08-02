import { build } from 'esbuild';

await build({
  entryPoints: ['server/index.prod.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: 'dist',
  external: [
    'express',
    'ws', 
    'drizzle-orm',
    '@neondatabase/serverless',
    'memorystore',
    'connect-pg-simple',
    'passport',
    'passport-local',
    'express-session',
    'crypto',
    'path',
    'fs',
    'http',
    'url',
    'zod',
    'zod-validation-error',
    'nanoid'
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  minify: false,
  sourcemap: false,
  treeShaking: true,
  loader: { '.ts': 'ts' }
});

console.log('Server build complete!');