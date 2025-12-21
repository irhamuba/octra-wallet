#!/bin/bash

# Octra Wallet - Development Testing Workflow
# This script makes development MUCH easier!

echo "🚀 Octra Wallet Development Helper"
echo ""
echo "Choose your testing mode:"
echo ""
echo "1) Browser Mode (RECOMMENDED) ⚡"
echo "   - Fast hot reload"
echo "   - Full console logs"
echo "   - React DevTools"
echo "   - Perfect for 95% of testing"
echo ""
echo "2) Extension Dev Mode 🔧"
echo "   - Test chrome.storage"
echo "   - Test extension popup"
echo "   - Still has console logs!"
echo ""
echo "3) Production Build 🏭"
echo "   - Final testing before release"
echo "   - Console logs stripped"
echo "   - Optimized bundle"
echo ""
read -p "Select mode (1/2/3): " mode

case $mode in
  1)
    echo ""
    echo "✅ Starting Browser Development Mode..."
    echo "📝 Console logs: ENABLED"
    echo "🔥 Hot reload: ENABLED"
    echo "🌐 Open: http://localhost:5173/"
    echo ""
    npm run dev
    ;;
  
  2)
    echo ""
    echo "✅ Preparing Extension Development Mode..."
    echo ""
    
    # Copy dev manifest
    cp manifest.dev.json dist/manifest.json 2>/dev/null || true
    
    # Start dev server in background
    npm run dev &
    DEV_PID=$!
    
    echo "📝 Console logs: ENABLED (check extension DevTools)"
    echo "🔧 Mode: Extension Development"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Open Chrome: chrome://extensions/"
    echo "  2. Enable 'Developer mode'"
    echo "  3. Click '↻ Reload' on Octra Wallet extension"
    echo "  4. Right-click extension icon → Inspect popup"
    echo "  5. Console tab will show all logs!"
    echo ""
    echo "Press Ctrl+C to stop dev server"
    
    # Wait for Ctrl+C
    trap "kill $DEV_PID 2>/dev/null" EXIT
    wait $DEV_PID
    ;;
  
  3)
    echo ""
    echo "✅ Building Production Version..."
    echo "⚠️  Console logs will be STRIPPED"
    echo ""
    npm run build
    
    if [ $? -eq 0 ]; then
      echo ""
      echo "✅ Build successful!"
      echo ""
      echo "📋 Load extension:"
      echo "  1. Open: chrome://extensions/"
      echo "  2. Enable 'Developer mode'"
      echo "  3. Click 'Load unpacked'"
      echo "  4. Select: $(pwd)/dist"
      echo ""
      echo "⚠️  Remember: No console logs in production!"
      echo "    Use Browser Mode for debugging"
    fi
    ;;
  
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac
