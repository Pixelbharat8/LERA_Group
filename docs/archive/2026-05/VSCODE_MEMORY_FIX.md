# VS Code Memory Optimization Guide

## 🚀 Quick Start (Recommended)

### Option 1: Use the Workspace File
Double-click `LERA_Group.code-workspace` to open VS Code with optimized settings.

### Option 2: Use the Startup Script
```bash
./start-vscode.sh
```

## 🔧 One-Time Setup (Do This Once)

Add this line to your `~/.zshrc` file:
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
```

Then restart your terminal:
```bash
source ~/.zshrc
```

## ✅ Optimizations Applied

| Setting | Value | Purpose |
|---------|-------|---------|
| TypeScript Memory | 4GB | Prevents TS server crashes |
| Java JVM Heap | 2GB | Smoother Spring Boot indexing |
| Node.js Heap | 8GB | Handles large workspace |
| File Watchers | Excluded heavy folders | Reduces CPU/memory |
| Editor Limit | 10 tabs max | Prevents memory buildup |
| Minimap | Disabled | Saves rendering memory |
| Git Auto-refresh | Disabled | Reduces background work |

## 📁 Excluded from Watching/Search

- `node_modules/`
- `.next/`
- `target/`
- `dist/`
- `build/`
- `database/archive/`
- `.git/objects/`

## 🛑 Best Practices

1. **Don't open large SQL files** while AI agent is running
2. **Close unused editor tabs** (limit is 10)
3. **Stop services** you're not actively testing
4. **Use Refresh buttons** instead of reloading pages
5. **Run one task at a time** (don't run frontend + all backends + AI)

## 🔄 If VS Code Crashes

1. Close VS Code completely
2. Run: `./start-vscode.sh`
3. Or open the workspace file: `LERA_Group.code-workspace`

## 📊 Memory Check

Your machine should have at least 16GB RAM for comfortable development with:
- VS Code + Extensions
- Next.js dev server
- 2-3 Spring Boot services
- AI Agent
