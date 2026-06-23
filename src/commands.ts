/**
 * Slash commands: /cbm-index and /cbm-status
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export function registerCommands(pi: ExtensionAPI, cbmBin: string | null) {
	// /cbm-index — quick-index the cwd
	pi.registerCommand("cbm-index", {
		description: "Index the current directory with codebase-memory-mcp",
		handler: async (_args, ctx) => {
			if (!cbmBin) {
				ctx.ui.notify("codebase-memory-mcp not found in PATH", "error");
				return;
			}

			ctx.ui.notify(`Indexing ${ctx.cwd}…`, "info");

			try {
				const result = await pi.exec(
					cbmBin,
					["cli", "index_repository", JSON.stringify({ repo_path: ctx.cwd })],
					{ timeout: 300_000 },
				);

				if (result.code === 0) {
					ctx.ui.notify("Indexing complete!", "info");
					ctx.ui.setStatus("cbm", "⚡ cbm: ready");
				} else {
					ctx.ui.notify(
						`Indexing failed: ${result.stderr?.trim() || "unknown error"}`,
						"error",
					);
				}
			} catch (err) {
				ctx.ui.notify(`Indexing error: ${String(err)}`, "error");
			}
		},
	});

	// /cbm-status — list indexed projects
	pi.registerCommand("cbm-status", {
		description:
			"Show codebase-memory-mcp indexing status for the current directory",
		handler: async (_args, ctx) => {
			if (!cbmBin) {
				ctx.ui.notify("codebase-memory-mcp not found in PATH", "error");
				return;
			}

			try {
				const result = await pi.exec(cbmBin, ["cli", "list_projects", "{}"], {
					timeout: 10_000,
				});

				if (result.code === 0 && result.stdout) {
					const data = JSON.parse(result.stdout.trim()) as {
						projects?: Array<{
							path?: string;
							name?: string;
							files?: number;
						}>;
					};
					const projects = data.projects ?? [];

					if (projects.length === 0) {
						ctx.ui.notify(
							"No projects indexed yet. Use /cbm-index to index this directory.",
							"info",
						);
					} else {
						const list = projects
							.map((p) => `• ${p.name ?? p.path} (${p.files ?? "?"} files)`)
							.join("\n");
						ctx.ui.notify(`Indexed projects:\n${list}`, "info");
					}
				}
			} catch (err) {
				ctx.ui.notify(`Error: ${String(err)}`, "error");
			}
		},
	});
}
