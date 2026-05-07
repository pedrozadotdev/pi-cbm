# pi-cbm

A [Pi agent](https://pi.dev) extension that integrates [codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) using its **CLI mode** — no MCP server, no stdio transport, just direct subprocess calls.

## What it does

| Feature | Pi mechanism | Claude Code equivalent |
|---------|-------------|----------------------|
| System prompt instructions | `before_agent_start` event | `CLAUDE.md` / instructions file |
| Advisory pre-tool hooks | `tool_call` event (non-blocking) | `PreToolUse` hooks (exit 0) |
| 14 codebase-memory-mcp tools | `pi.registerTool()` | MCP tool calls |
| `/cbm-index` command | `pi.registerCommand()` | — |
| `/cbm-status` command | `pi.registerCommand()` | — |

## Prerequisites

Install `codebase-memory-mcp` and ensure it is available in your `PATH`:

```powershell
# Windows (PowerShell)
Invoke-WebRequest -Uri https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.ps1 -OutFile install.ps1
.\install.ps1 --skip-config
```

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.sh | bash -s -- --skip-config
```

> Use `--skip-config` since this extension replaces the MCP server configuration.

Verify installation:
```bash
codebase-memory-mcp --version
```

## Installation

### As a Pi package (recommended)

```bash

# From git
pi install git:github.com/pedrozadotdev/pi-cbm
```

### Manual install (global)
```bash
# Copy the entire directory
cp -r . ~/.pi/agent/extensions/pi-cbm/
```

### Manual install (project-local)
```bash
cp -r . .pi/extensions/pi-cbm/
```

### Quick test
```bash
pi -e ./src/index.ts
```

## Usage

### 1. Index your project
```
/cbm-index
```
Or ask the agent:
```
Index this project with codebase-memory-mcp
```

### 2. Use graph tools

The agent will automatically prefer `cbm_` tools for structural queries:

```
What functions call processOrder?
→ agent uses cbm_trace_call_path

Search for all HTTP route handlers
→ agent uses cbm_search_graph with label='Route'

What is the architecture of this codebase?
→ agent uses cbm_get_architecture

Find code related to "authentication middleware" semantically
→ agent uses cbm_semantic_query
```

### 3. Check status
```
/cbm-status
```

## Available Tools

| Tool | Description |
|------|-------------|
| `cbm_index_repository` | Index a repo into the knowledge graph |
| `cbm_index_status` | Indexing status for a project |
| `cbm_search_graph` | Structural search (symbols, patterns, labels) |
| `cbm_search_code` | Graph-augmented grep over indexed files |
| `cbm_semantic_query` | Semantic vector search (no API key needed) |
| `cbm_query_graph` | Cypher-like graph queries |
| `cbm_get_graph_schema` | Graph schema (node labels, edge types) |
| `cbm_trace_call_path` | Call graph traversal (callers/callees) |
| `cbm_get_code_snippet` | Source code for a symbol by qualified name |
| `cbm_get_architecture` | Architecture overview (languages, packages, routes) |
| `cbm_detect_changes` | Impact analysis of uncommitted changes |
| `cbm_list_projects` | List all indexed projects |
| `cbm_delete_project` | Remove a project from the index |
| `cbm_manage_adr` | Architecture Decision Records management |

## Project Structure

```
pi-cbm/
├── package.json              # npm package with pi.extensions entry
├── README.md
├── LICENSE
└── src/
    ├── index.ts              # Extension entry point (factory function)
    ├── cli.ts                # Binary detection + CLI runner helper
    ├── instructions.ts       # System prompt text (≈ CLAUDE.md)
    ├── hooks.ts              # Lifecycle hooks (session_start, before_agent_start, tool_call)
    ├── commands.ts           # Slash commands (/cbm-index, /cbm-status)
    └── tools/
        ├── index.ts          # Barrel — registers all tool groups
        ├── indexing.ts       # index_repository, index_status
        ├── search.ts         # search_graph, search_code, semantic_query
        ├── graph.ts          # query_graph, get_graph_schema, trace_call_path, get_code_snippet
        ├── analysis.ts       # get_architecture, detect_changes
        └── management.ts     # list_projects, delete_project, manage_adr
```

## CLI Mode vs MCP Mode

This extension uses **CLI mode** exclusively:

```bash
# Under the hood, each tool call runs:
codebase-memory-mcp cli --raw <tool_name> '{"param": "value"}'
```

Benefits:
- No background server process to manage
- Works in any environment where the binary is in PATH
- Simple subprocess call with JSON in/out
- No port conflicts, no server restarts needed

## How it maps to Claude Code integration

codebase-memory-mcp for Claude Code uses:
1. **CLAUDE.md** — instructions injected into every session → replicated via `before_agent_start` in [`src/hooks.ts`](src/hooks.ts)
2. **PreToolUse hooks** — advisory shell scripts that remind Claude to use graph tools → replicated via `tool_call` event in [`src/hooks.ts`](src/hooks.ts)

This extension replicates both patterns using Pi's native extension API.

## License

MIT
