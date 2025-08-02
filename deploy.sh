#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting deployment build process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build frontend
echo "🏗️ Building React frontend..."
npx vite build

# Build backend (production only, no Vite)
echo "🏗️ Building Node.js backend for production..."
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

# Ensure no development files exist
echo "🛡️ Removing any development artifacts..."
rm -f dist/index.js

# Verify build
echo "✅ Verifying production build..."
if [ ! -f "dist/index.prod.js" ]; then
  echo "❌ ERROR: Production server file not found!"
  exit 1
fi

if [ ! -d "dist/public" ]; then
  echo "❌ ERROR: Frontend build not found!"
  exit 1
fi

# Check for Vite imports (should return nothing)
if grep -q "vite" dist/index.prod.js; then
  echo "❌ ERROR: Vite imports found in production build!"
  exit 1
fi

echo "✅ Deployment build complete!"
echo ""
echo "📂 Build artifacts:"
echo "  - Frontend: dist/public/"
echo "  - Backend: dist/index.prod.js"
echo ""
echo "🚀 Ready for deployment:"
echo "  - Docker: docker build -t whispr-chat ."
echo "  - Render: Push to GitHub repository"
echo "  - Manual: NODE_ENV=production node dist/index.prod.js"