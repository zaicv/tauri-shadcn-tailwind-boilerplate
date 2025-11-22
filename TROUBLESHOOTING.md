# 🔧 Troubleshooting Guide

## Quick Start

```bash
# Kill any running processes
lsof -ti:1420 | xargs kill -9 2>/dev/null

# Start development server
bun run dev

# Or start Tauri desktop app
bun run tauri:dev
```

## Common Issues & Fixes

### ❌ White Screen / Blank Page

**Symptoms**: App loads but shows nothing  
**Causes**:
1. JavaScript errors in console
2. Missing dependencies
3. Import path errors
4. Context provider issues

**Solutions**:
```bash
# 1. Check browser console (F12) for errors
# 2. Restart dev server
pkill -9 -f vite && bun run dev

# 3. Clear cache and reinstall
rm -rf node_modules bun.lock
bun install
bun run dev
```

### ❌ Port 1420 Already in Use

**Solution**:
```bash
lsof -ti:1420 | xargs kill -9
pkill -9 -f vite
pkill -9 -f sukunai
```

### ❌ Supabase Errors

The app works WITHOUT Supabase! It uses fallback values.

**To use Supabase** (optional):
1. Create `.env` file in project root:
```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### ❌ React Three Fiber Errors

**Error**: `undefined is not an object (evaluating 'ReactSharedInternals.S')`

**Solution**: Already installed! If you see this:
```bash
bun add @react-three/fiber @react-three/drei three
```

### ❌ Import Path Errors

**Error**: `Failed to resolve import`

**Fix**: Use `@/` alias for imports:
```typescript
// ✅ Good
import { Component } from "@/components/Component"

// ❌ Bad  
import { Component } from "../../../components/Component"
```

### ❌ Tailwind CSS Not Working

**Solution**:
1. Check `postcss.config.cjs` - should NOT have `tailwindcss: {}`
2. Check `vite.config.ts` - should have `tailwindcss()` plugin
3. Restart server

## App Architecture

### Context Providers (Order Matters!)
```
ErrorBoundary
  → Router
    → ThemeProvider
      → AuthProvider
        → PersonaProvider
          → WebSocketProvider
            → SidebarProvider
              → AppContent
```

### Key Files
- `src/App.tsx` - Main app with routing
- `src/main.tsx` - React entry point
- `src/components/ErrorBoundary.tsx` - Catches errors
- `src/components/Global/GlobalNavBar.tsx` - Navigation
- `src/context/` - Context providers

### Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/` | GlowDashboard | Home page with orb |
| `/chat` | Chat | Chat interface |
| `/personas` | Personas | Persona selection |
| `/superpowers` | Superpowers | Features hub |
| `/memories` | Memories | Memory system |
| `/knowledge-base` | KnowledgeBase | Knowledge base |
| `/login` | LoginPage | Authentication |

## Debugging Checklist

- [ ] Port 1420 is free
- [ ] Dev server is running (`bun run dev`)
- [ ] No errors in terminal
- [ ] Browser console (F12) shows no errors
- [ ] All dependencies installed (`bun install`)
- [ ] Using latest code (check git status)
- [ ] `.env` file exists (optional, for Supabase)

## Error Boundary

The app has comprehensive error boundaries! If you see a red error screen:
1. Read the error message
2. Click "Error details" to see more
3. Click "Reload Page" to try again

## Performance Tips

### Slow Loading
- Pages are lazy-loaded for better performance
- First load is slower, subsequent loads are fast
- Clear browser cache if needed

### Dev Server Issues
```bash
# Full reset
pkill -9 -f vite
rm -rf node_modules/.vite
bun run dev
```

## Need Help?

1. Check browser console (F12)
2. Check terminal output
3. Read error messages in the ErrorBoundary screen
4. Try the solutions above

## Dependencies

### Critical
- `react` + `react-dom` - UI framework
- `react-router-dom` - Routing
- `@tauri-apps/api` - Tauri integration
- `framer-motion` - Animations
- `@react-three/fiber` - 3D orb
- `@supabase/supabase-js` - Database (optional)

### UI Components
- All `@radix-ui/*` packages
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `sonner` - Toast notifications

## Quick Commands

```bash
# Development
bun run dev              # Web only
bun run tauri:dev        # Desktop app

# Build
bun run build           # Web build
bun run tauri:build     # Desktop app build

# Maintenance
bun install             # Install deps
bun run lint            # Check code

# Cleanup
rm -rf node_modules bun.lock && bun install
pkill -9 -f "vite|tauri|sukunai"
```

## Notes

- **Theme**: Defaults to dark mode
- **Auth**: Optional, works without Supabase
- **Personas**: Uses default "Glow Assistant" if Supabase not configured
- **3D Orb**: Requires @react-three packages (installed)
- **Hot Reload**: Automatic, just save files

