---
title: "MCP Tool Parameter Defaulting from Agent Context"
category: tooling
severity: high
tags:
  - mcp
  - tool-registration
  - ctx
  - parameter-defaulting
  - optional-params
  - pi-coding-agent
  - tool-interface
applies_when:
  - Building MCP server tools that register with pi.registerTool()
  - Making tool parameters optional when they can be derived from agent context
  - Reducing model cognitive load by eliminating redundant required params
  - Adding ctx parameter to execute callbacks in MCP tools
  - Writing tests for MCP tool parameter defaulting behavior
---

# MCP Tool Parameter Defaulting from Agent Context

## Problem

MCP tools registered via `pi.registerTool()` frequently require the model to pass parameters
that are already available from the agent context (`ctx.cwd`). This causes:

1. **Model confusion**: models pass misspelled names, wrong paths, or inconsistent values
2. **Cognitive load**: every tool call requires remembering and supplying information already known
3. **Inconsistent behavior**: some tools auto-derive from context while others require explicit params

In the pi-cbm project (codebase-memory-mcp), 12 out of 14 CBM tools required `project` and/or `repo_path`
parameters that could be derived from `ctx.cwd`, leading to frequent "wrong param passed" tool failures.

## Context

This was discovered during a refactor of the pi-cbm MCP server extension (October 2025).
The project registers 14 tools via `pi.registerTool()` that interface with the CBM CLI (Codebase
Memory MCP). The model was expected to pass `project` (project name) and `repo_path` (repository
path) parameters for every tool call, but these values are always the current working directory
the model is operating in.

- **Repository**: pi-cbm (codebase-memory-mcp)
- **Tools affected**: `cbm_index_repository`, `cbm_index_status`, `cbm_search_graph`,
  `cbm_search_code`, `cbm_query_graph`, `cbm_get_graph_schema`, `cbm_trace_call_path`,
  `cbm_get_architecture`, `cbm_detect_changes`, `cbm_ingest_traces`, `cbm_delete_project`,
  `cbm_manage_adr`
- **Tools unchanged**: `cbm_list_projects` (stateless, no params), `cbm_get_code_snippet`
  (no `project` param — model copies from search results)

## Solution

### Pattern: Optional params with `ctx.cwd` fallback

For each MCP tool, apply this pattern:

1. **Parameter schema**: change required params to `Type.Optional()` with an updated description
   mentioning that the value defaults to the current project/directory.

2. **Execute callback**: add `ctx` as the 5th parameter to the `execute` function signature.

3. **Defaulting logic**: use `??` (nullish coalescing) to fallback to `ctx.cwd` when the param
   is omitted, preserving the override when explicitly provided.

```typescript
// Schema — make the param optional
parameters: Type.Object({
  project: Type.Optional(
    Type.String({ description: "Project name (defaults to current directory)" }),
  ),
  // ... other params
}),

// Execute — thread ctx as 5th param, default project from ctx.cwd
async execute(_id, params, signal, _onUpdate, ctx) {
  const result = await runCbm(pi, cbmBin, "search_graph", {
    ...params,
    project: params.project ?? ctx.cwd,
  }, signal);
  return {
    content: [{ type: "text", text: formatResult(result) }],
    details: { result },
  };
},
```

### Key variants

**For `repo_path` parameters** (path-based tools):

```typescript
// Schema
parameters: Type.Object({
  repo_path: Type.Optional(
    Type.String({
      description: "Absolute path to the repo (defaults to current working directory)",
    }),
  ),
}),

// Execute
async execute(_id, params, signal, onUpdate, ctx) {
  const repoPath = params.repo_path ?? ctx.cwd;
  // ...
}
```

**For stateless tools with no params** (already auto-derived):
Simply remove the params and always use `ctx.cwd`:

```typescript
parameters: Type.Object({}),  // empty — no params

async execute(_id, _params, signal, _onUpdate, ctx) {
  const result = await runCbm(pi, cbmBin, "detect_changes",
    { repo_path: ctx.cwd }, signal);
  // ...
}
```

**For tools where the model copies from prior results**:
No change needed — the model copies qualified names from search results:

```typescript
// cbm_get_code_snippet: unchanged — model copies qualified_name from search results
// cbm_list_projects: unchanged — stateless, no params needed
```

## Why this works

1. **`ctx.cwd`** is set by the agent harness to the directory the model is working in.
   CBM CLI (Codebase Memory) supports path-based project resolution — it matches the
   longest path prefix to find the indexed project.

2. **`??` over `||`** — The nullish coalescing operator only falls back for `null`/`undefined`,
   not falsy values. This preserves empty string overrides if a model explicitly passes them.

3. **`Type.Optional()`** in the typebox schema makes the parameter non-required in the JSON schema
   exposed to the model. The model sees it listed but is not forced to supply it.

4. **`ctx` as the 5th parameter** is the standard MCP pattern for `execute` callbacks:
   `(_id, params, signal, _onUpdate, ctx)` — always in this position after `_onUpdate`.

5. **Override backward compatibility**: if a model explicitly passes `project: "override-name"`,
   it is preserved via `params.project ?? ctx.cwd` — the explicit value takes precedence.

## Prevention

### For new MCP tools (design-time)

When registering a new tool via `pi.registerTool()`, follow this decision tree:

```
┌─────────────────────────────────────┐
│ Is the param always the same as     │
│ the current working directory?      │
└─────────────────┬───────────────────┘
                  │
         ┌──── yes ────┐  no
         ▼              ▼
   Make optional     Keep required
   default ctx.cwd   (param is truly
   with ?? ctx.cwd   independent of cwd)
```

Ask: "Will the model ever need to pass a value different from `ctx.cwd` for this parameter?"
If yes, keep it available as optional. If no (like `detect_changes` which only makes sense
for the current project), remove the param entirely.

### For testing parameter defaulting (test-time)

When testing MCP tool parameter defaulting, use this pattern with `node:test`:

```typescript
import { test } from "node:test";
import assert from "node:assert/strict";

// Mock the ExtensionAPI
const mockPi = {
  registerTool: (def: any) => { tools.set(def.name, def); },
  exec: async () => ({ code: 0, stdout: "{}", stderr: "", killed: false }),
} as unknown as ExtensionAPI;

// Test: without param → defaults to ctx.cwd
test("tool: without project defaults to ctx.cwd", async () => {
  const tool = tools.get("cbm_search_graph");
  await tool.execute("id", { /* no project */ }, undefined, undefined, {
    cwd: "/fake/project",
  });
  // assert that exec was called with project = ctx.cwd
});

// Test: with explicit param → passed through as override
test("tool: with explicit project passes through", async () => {
  const tool = tools.get("cbm_search_graph");
  await tool.execute("id", { project: "override" }, undefined, undefined, {
    cwd: "/fake/project",
  });
  // assert that exec was called with project = "override"
});
```

> **⚠️ Avoid mock duplication**: The `createMockPi()`, `FAKE_CWD`, and utility functions
> should be extracted into a shared `test-utils.ts` module rather than copy-pasted across
> every test file. In the pi-cbm project, this pattern was duplicated 5 times with 95 clone
> instances and 34.5% duplication rate — a significant maintainability cost.

### For diff hygiene (review-time)

When making mechanical changes across many tools (like adding `ctx` to execute signatures
across 10+ tools), **do not mix formatting changes** (indentation, whitespace reformatting)
with semantic changes in the same diff. The pi-cbm refactor had an ~80% diff inflation
because 2-space indentation was changed to tabs in the same commit as the parameter defaulting
logic. Separate formatting changes into their own commit or PR.

## Overlap Rules

This solution covers the **MCP tool parameter defaulting** pattern specifically for `pi.registerTool()`
callbacks in the pi-coding-agent SDK. Related solutions in `tooling/` fall into these overlap levels:

| Overlap Level | When to merge | Example |
|---|---|---|
| **High** | Same API (`pi.registerTool()`), same defaulting mechanism (`?? ctx.cwd`), same execute callback shape | A solution about "defaulting params from agent environment" with the identical `(_id, params, signal, _onUpdate, ctx)` pattern |
| **Moderate** | Related problem but different mechanism (e.g., defaulting from config files, env vars, or LLM prompts rather than `ctx.cwd`) | A solution about "environment-aware parameter injection via middleware" |
| **Low** | Only loosely related — different tool SDKs, different context sources, or different parameter patterns | A solution about REST API parameter schemas or CLI argument parsing |

**Decision rule**: If the solution describes exactly `Type.Optional() + 5th-param ctx + ?? ctx.cwd` it
should be merged here. If it describes a different defaulting source (env, config, prompt), create a
distinct doc and cross-link it.

## Search Strategy

### Primary discovery keywords

For `02-plan` and `04-review` stages searching for relevant learnings:

```bash
# Most precise — tags match
grep -rl "tags:.*mcp\|tags:.*parameter-defaulting\|tags:.*tool-registration" docs/solutions/
# Title match
grep -rl "title:.*parameter defaulting\|title:.*optional param" docs/solutions/
# Target applies_when
grep -rl "applies_when:.*Tool" docs/solutions/
```

### Related queries for broader search

- `"MCP tool parameters"` → matches `tags: [mcp, tool-registration]`
- `"ctx.cwd"` → matches the core pattern content
- `"Type.Optional"` → matches the schema pattern
- `"parameter defaulting"` → matches title and tags
- `"model cognitive load"` → matches `applies_when` and Problem section

### Cross-references

- [`tooling/mcp-tool-parameter-defaulting.md`](./mcp-tool-parameter-defaulting.md) — this file
- `pi-coding-agent` SDK docs for `ExtensionAPI.registerTool()` and `ToolContext` interface
- Typebox documentation for `Type.Optional()` schema utilities
- CBM CLI documentation for path-based project resolution

### Scoring guidance

| Match quality | Indicator | Action |
|---|---|---|
| **Strong** | `tags` contain `mcp`, `tool-registration`, `parameter-defaulting` | Read full solution |
| **Moderate** | `title` or `applies_when` contain `tool`, `parameter`, `context` | Scan frontmatter |
| **Weak** | Only tangentially related (e.g., a different tool SDK) | Skip |

Sort by `severity` (high) when multiple matches exist.

## Related

- [CBM CLI documentation](https://github.com/pedrozadotdev/pi-cbm) — path-based project resolution
- `pi.registerTool()` API — `ExtensionAPI` interface in `@earendil-works/pi-coding-agent`
- `Type.Optional()` — Typebox schema utility for optional parameters
