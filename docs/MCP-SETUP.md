# MCP Server Configuration

See main guide: [CLAUDE.md](../CLAUDE.md)

---

## Overview

**Claude Code MCP Servers** enhance development with specialized tools for documentation, version control, database access, and browser automation.

---

## Configured Servers

| Server | Purpose | Setup Required |
|--------|---------|----------------|
| **github** | PR/issue management, repository operations | ✅ `$GITHUB_PAT` |
| **git** | Local git operations (commit, branch, status) | ❌ Auto-configured |
| **supabase** | Database schema inspection, query execution | ❌ Auto-configured |
| **context7** | Up-to-date library documentation | ✅ `$CONTEXT7_API_KEY` |
| **playwright** | Browser automation, test generation | ❌ Auto-configured |
| **memory** | Persistent context across sessions | ❌ Auto-configured |
| **sequential-thinking** | Extended reasoning for complex problems | ❌ Auto-configured |

---

## Configuration File

**Location:** `.mcp.json` (project root, gitignored)

---

## Shell Environment Setup

MCP servers require shell-level environment variables (different from `.env.local`):

**Add to `~/.zshrc`:**
```bash
# Claude MCP Server Credentials
export GITHUB_PAT="your_github_personal_access_token"
export CONTEXT7_API_KEY="your_context7_api_key"
```

**Get credentials:**
- **GitHub PAT:** https://github.com/settings/tokens (scopes: `repo`, `workflow`, `read:org`)
- **Context7 Key:** https://console.upstash.com/ (free tier available)

**Reload shell:**
```bash
source ~/.zshrc
```

**Restart Claude Code** after configuration changes.

---

## Usage Examples

```bash
# GitHub MCP - PR management
"Create a PR for this story"

# Git MCP - Local operations
"Show me the current git status"

# Supabase MCP - Database exploration
"Show me all tables and their schemas"

# Context7 MCP - Latest documentation
"Look up Next.js 16 server actions in the latest docs"

# Playwright MCP - Test generation
"Generate a Playwright test for the resume upload flow"

# Memory MCP - Persistent context
"Remember that I prefer camelCase for TypeScript"
```

---

## Architecture Note

**Layer separation:**
- `~/.zshrc` → Tool credentials (Claude Code, MCP servers)
- `.env.local` → App credentials (Supabase, Anthropic)
- `.mcp.json` → MCP configuration (references shell vars)

This separation ensures proper security boundaries and maintainability.

