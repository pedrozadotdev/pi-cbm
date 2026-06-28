/**
 * Lifecycle event hooks:
 *   - session_start      → check binary + index status, show footer
 *   - before_agent_start → inject system-prompt instructions (≈ CLAUDE.md)
 *   - tool_call          → advisory nudge toward graph tools (≈ PreToolUse)
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { SYSTEM_PROMPT_INSTRUCTIONS } from "./instructions";

export function registerHooks(pi: ExtensionAPI, cbmBin: string | null) {
	// ---------------------------------------------------------------------------
	// session_start — binary check + index-status footer
	// ---------------------------------------------------------------------------
	pi.on("session_start", async (_event, ctx) => {
		if (!cbmBin) {
			ctx.ui.notify(
				"codebase-memory-mcp not found in PATH. " +
					"Install from https://github.com/DeusData/codebase-memory-mcp",
				"warning",
			);
			return;
		}

		try {
			const result = await pi.exec(cbmBin, ["cli", "list_projects", "{}"], {
				timeout: 10_000,
			});

			if (result.code === 0 && result.stdout) {
				const data = JSON.parse(result.stdout.trim()) as {
					projects?: Array<{ root_path?: string; name?: string }>;
				};
				const cwd = ctx.cwd;
				const isIndexed = data.projects?.some(
					(p) => p.root_path === cwd || cwd.startsWith(p.root_path ?? ""),
				);

				ctx.ui.setStatus(
					"cbm",
					isIndexed
						? "⚡ cbm: ready"
						: "⚡ cbm: not indexed — use cbm_index_repository",
				);
			}
		} catch {
			// silently skip — binary may not support list_projects or JSON yet
		}
	});

	// ---------------------------------------------------------------------------
	// before_agent_start — system-prompt injection (equivalent to CLAUDE.md)
	// ---------------------------------------------------------------------------
	pi.on("before_agent_start", async (_event, ctx) => {
		if (!cbmBin) return;

		return {
			systemPrompt: ctx.getSystemPrompt() + "\n\n" + SYSTEM_PROMPT_INSTRUCTIONS,
		};
	});

	// ---------------------------------------------------------------------------
	// tool_call — advisory nudge hook (non-blocking)
	//
	// When the agent attempts a file-search tool (grep, find, read) AND the
	// cbm binary is available, this hook sends a gentle steering message into
	// the conversation to remind the agent about the graph tools.
	//
	// The call is NOT blocked — the message is advisory only, equivalent to
	// Claude Code's PreToolUse hooks (exit 0). The harder enforcement lives
	// in the system prompt (instructions.ts).
	// ---------------------------------------------------------------------------
	pi.on("tool_call", async (event, ctx) => {
		if (!cbmBin) return;

		const nudgeTargets = ["grep", "find", "read", "rg", "ag", "cat"];
		if (nudgeTargets.includes(event.toolName)) {
			ctx.ui.notify(
				"💡 Tip: Prefer cbm_ tools for code queries — " +
					"use cbm_search_graph for symbols, cbm_search_code for text search, " +
					"cbm_trace_call_path for call chains, or cbm_get_code_snippet for known symbols. " +
					"The graph is faster and costs fewer tokens.",
				"info",
			);
			return undefined;
		}

		return undefined;
	});
}
