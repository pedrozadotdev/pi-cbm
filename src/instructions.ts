/**
 * System prompt instructions injected via `before_agent_start`.
 *
 * This is the Pi equivalent of the CLAUDE.md / instructions file that
 * codebase-memory-mcp installs for Claude Code.
 *
 * These instructions are deliberately prescriptive: the agent MUST use
 * graph tools FIRST before falling back to file-based tools like bash,
 * grep, find, or read. This order of operations saves orders of magnitude
 * in latency and token cost.
 */

export const SYSTEM_PROMPT_INSTRUCTIONS = `
## Codebase Intelligence (codebase-memory-mcp)

You have access to a high-performance code knowledge graph via codebase-memory-mcp tools (prefixed \`cbm_\`).

### ⚠️  MANDATORY ORDER OF OPERATIONS

You MUST use \`cbm_\` tools FIRST before resorting to any file-based tools (\`bash\`, \`grep\`, \`find\`, \`read\`, \`cat\`, \`rg\`, \`ag\`, etc.).

The knowledge graph returns sub-millisecond answers with 99% fewer tokens than grep or file reads.

**You MUST follow this ordering:**

1. **Try the graph first** — use \`cbm_search_graph\` for symbols (functions, classes, types), \`cbm_trace_call_path\` for call chains, \`cbm_get_architecture\` for structure, \`cbm_search_code\` for text/regex in indexed files, \`cbm_get_code_snippet\` for known symbols, \`cbm_query_graph\` for custom queries.
2. **Fall back to file tools only if** — (a) the project is not indexed, (b) the graph tool returned no results, or (c) you need file contents that the graph does not store (e.g. full file text, comments, formatting).

**Violation examples (DO NOT DO):**
- ❌ Using \`bash\` with \`grep\` or \`find\` to look for a function definition → use \`cbm_search_graph\` instead
- ❌ Using \`read\` to open a file and search for a symbol → use \`cbm_search_graph\` or \`cbm_search_code\` instead
- ❌ Using \`bash find\` to discover files by pattern → use \`cbm_search_graph label='File'\` instead

**What to use for each task:**

| Task | Use this first | Fallback only if graph fails |
|------|----------------|------------------------------|
| Find a function, class, or type | \`cbm_search_graph\` with \`name_pattern\` and/or \`label\` | \`grep\` / \`bash rg\` |
| Trace who calls a function | \`cbm_trace_call_path direction='inbound'\` | \`grep -r\` + manual reading |
| Understand codebase structure | \`cbm_get_architecture\` | Manual exploration |
| Search source for a text/regex pattern | \`cbm_search_code\` | \`bash grep\` / \`bash rg\` |
| Get code for a known symbol | \`cbm_get_code_snippet\` | \`read\` (entire file) |
| Impact analysis of changes | \`cbm_detect_changes\` | Manual diff inspection |
| Custom structural queries | \`cbm_query_graph\` (Cypher) | N/A |
| See all indexed projects | \`cbm_list_projects\` | N/A |

**Workflow:**
1. If not yet indexed, call \`cbm_index_repository\` with the repo path first
2. Prefer graph queries (sub-ms, 99% fewer tokens) over repeated grep/read cycles
3. Use \`cbm_search_graph\` instead of grep when searching for functions, classes, methods, or other symbols by name or pattern.
4. Use \`cbm_search_graph\` with \`label='Function'\` to find all functions, \`label='Class'\` for classes, etc.
5. Use \`cbm_trace_call_path\` to answer 'what calls X?' (direction='inbound') or 'what does X call?' (direction='outbound').
6. Use \`cbm_get_code_snippet\` to retrieve source code for a specific symbol instead of reading the whole file with read.
7. Use \`cbm_get_architecture\` for a quick structural overview of the codebase before diving into details.
8. Use \`cbm_detect_changes\` to understand the impact of current uncommitted changes before a commit or code review.
9. Use \`cbm_query_graph\` for custom Cypher-like queries when \`cbm_search_graph\` or \`cbm_trace_call_path\` are not expressive enough.

**Node labels:** Project, Package, Folder, File, Module, Class, Function, Method, Interface, Enum, Type, Route, Resource

**Edge types:** CALLS, IMPORTS, DEFINES, IMPLEMENTS, INHERITS, HTTP_CALLS, ASYNC_CALLS, EMITS, LISTENS_ON, DATA_FLOWS, SIMILAR_TO, SEMANTICALLY_RELATED
`.trim();
