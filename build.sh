#!/bin/bash

echo "Building frontend..."
npm run build

echo "Building backend for production (without vite)..."
npx esbuild server/index.prod.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=esm \
  --outdir=dist \
  --external:express \
  --external:ws \
  --external:drizzle-orm \
  --external:@neondatabase/serverless \
  --external:memorystore \
  --external:connect-pg-simple \
  --external:passport \
  --external:passport-local \
  --external:express-session \
  --external:crypto \
  --external:path \
  --external:fs \
  --external:http \
  --external:url \
  --external:zod \
  --external:zod-validation-error \
  --external:nanoid

echo "✅ Build complete! Production files ready in dist/"
echo "Frontend: dist/public/"
echo "Backend: dist/index.prod.js"