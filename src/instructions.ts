/**
 * System prompt instructions injected via `before_agent_start`.
 *
 * Kept intentionally short: each `cbm_*` tool already ships its own
 * description and snippet, so this only states the default (prefer the graph)
 * and the fallback (file tools when the graph can't answer).
 */

export const SYSTEM_PROMPT_INSTRUCTIONS =
	"Codebase Intelligence (codebase-memory-mcp): `cbm_*` tools query an indexed code knowledge graph — prefer them for structural questions (symbols, call chains, impact, architecture); fall back to `grep`/`read` when a project isn't indexed or the graph has no answer.";
