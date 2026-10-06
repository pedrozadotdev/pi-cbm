/**
 * Lifecycle event hooks:
 *   - session_start      → check binary + index status, show footer
 *   - before_agent_start → inject system-prompt instructions (≈ CLAUDE.md)
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { listProjects } from "./cli";
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

		const projects = await listProjects(pi, cbmBin);
		if (!projects) return; // silently skip

		const cwd = ctx.cwd;
		const isIndexed = projects.some(
			(p) => p.root_path === cwd || cwd.startsWith(p.root_path ?? ""),
		);

		ctx.ui.setStatus(
			"cbm",
			isIndexed
				? "⚡ cbm: ready"
				: "⚡ cbm: not indexed — use cbm_index_repository",
		);
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
}
