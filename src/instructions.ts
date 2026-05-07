/**
 * System prompt instructions injected via `before_agent_start`.
 *
 * This is the Pi equivalent of the CLAUDE.md / instructions file that
 * codebase-memory-mcp installs for Claude Code.
 */

export const SYSTEM_PROMPT_INSTRUCTIONS = `
## Codebase Intelligence (codebase-memory-mcp)

You have access to a high-performance code knowledge graph via codebase-memory-mcp tools (prefixed \`cbm_\`).

**When to prefer graph tools over file exploration:**
- Searching for functions, classes, types → use \`cbm_search_graph\` instead of grep/find
- Tracing call chains ("what calls X?", "what does Y call?") → use \`cbm_trace_call_path\`
- Understanding codebase structure/architecture → use \`cbm_get_architecture\`
- Finding symbols by pattern → use \`cbm_search_graph\` with \`name_pattern\`
- Semantic/conceptual search → use \`cbm_semantic_query\`
- Impact analysis of a change → use \`cbm_detect_changes\`
- Custom graph queries → use \`cbm_query_graph\` (Cypher subset)
- Getting code for a known symbol → use \`cbm_get_code_snippet\`

**Workflow:**
1. If not yet indexed, call \`cbm_index_repository\` with the repo path first
2. Prefer graph queries (sub-ms, 99% fewer tokens) over repeated grep/read cycles
3. Use \`cbm_list_projects\` to see what is already indexed

**Node labels:** Project, Package, Folder, File, Module, Class, Function, Method, Interface, Enum, Type, Route, Resource

**Edge types:** CALLS, IMPORTS, DEFINES, IMPLEMENTS, INHERITS, HTTP_CALLS, ASYNC_CALLS, EMITS, LISTENS_ON, DATA_FLOWS, SIMILAR_TO, SEMANTICALLY_RELATED
`.trim();
