#!/bin/bash
# Deployment Checklist for Performance-Optimized Cosvys App

echo "🚀 Pre-Deployment Performance Optimization Checklist"
echo "=================================================="
echo ""

# Check 1: Build succeeds
echo "✓ Build Test..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  ✅ Build successful"
else
  echo "  ❌ Build failed - fix errors first"
  exit 1
fi

# Check 2: Bundle size analysis
echo ""
echo "✓ Bundle Size Analysis..."
BUNDLE_SIZE=$(du -sh dist/ | cut -f1)
echo "  📦 Total dist folder: $BUNDLE_SIZE"

# Check 3: Verify key files exist
echo ""
echo "✓ Configuration Files..."
if [ -f "vercel.json" ]; then
  echo "  ✅ vercel.json present (deployment config)"
else
  echo "  ⚠️  vercel.json missing"
fi

if [ -f "vite.config.ts" ]; then
  echo "  ✅ vite.config.ts optimized (build config)"
else
  echo "  ⚠️  vite.config.ts missing"
fi

# Check 4: Code splitting enabled
echo ""
echo "✓ Code Splitting..."
if grep -q "lazy()" src/App.tsx; then
  echo "  ✅ Route-based code splitting enabled"
else
  echo "  ⚠️  Code splitting not detected"
fi

# Check 5: Chunk files generated
echo ""
echo "✓ Build Artifacts..."
JS_FILES=$(find dist/js -type f -name "*.js" | wc -l)
CSS_FILES=$(find dist/css -type f -name "*.css" | wc -l)
echo "  📊 JavaScript chunks: $JS_FILES files"
echo "  📊 CSS chunks: $CSS_FILES files"

# Check 6: Service worker
echo ""
echo "✓ PWA & Service Worker..."
if [ -f "dist/sw.js" ]; then
  echo "  ✅ Service Worker generated"
else
  echo "  ⚠️  Service Worker missing"
fi

# Summary
echo ""
echo "=================================================="
echo "✨ Deployment Checklist Complete!"
echo ""
echo "Next Steps:"
echo "1. git add ."
echo "2. git commit -m 'perf: optimize for faster Vercel deployment'"
echo "3. git push"
echo ""
echo "Vercel will auto-deploy and apply optimizations!"
echo "=================================================="

