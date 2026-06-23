/**
 * Indexing tools: index_repository, index_status
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { runCbm, formatResult } from "../cli";

export function registerIndexingTools(pi: ExtensionAPI, cbmBin: string | null) {
	pi.registerTool({
		name: "cbm_index_repository",
		label: "CBM: Index Repository",
		description:
			"Index a repository into the codebase knowledge graph. Must be called before any graph queries on a new project. Supports 155 languages.",
		promptSnippet:
			"Index a codebase into the knowledge graph for structural queries",
		promptGuidelines: [
			"Use cbm_index_repository to index a project before using other cbm_ graph tools on it.",
		],
		parameters: Type.Object({
			repo_path: Type.Optional(
				Type.String({
					description:
						"Absolute path to the repository root to index (defaults to current working directory)",
				}),
			),
		}),
		async execute(_id, params, signal, onUpdate, ctx) {
			const repoPath = params.repo_path ?? ctx.cwd;
			onUpdate?.({
				content: [{ type: "text", text: `Indexing ${repoPath}…` }],
			});
			const result = await runCbm(
				pi,
				cbmBin,
				"index_repository",
				{ repo_path: repoPath },
				signal,
			);
			return {
				content: [{ type: "text", text: formatResult(result) }],
				details: { result },
			};
		},
	});

	pi.registerTool({
		name: "cbm_index_status",
		label: "CBM: Index Status",
		description:
			"Get the indexing status for a project: whether it is indexed, when it was last updated, node/edge counts, and pending changes.",
		promptSnippet:
			"Check the indexing status of a project in the knowledge graph",
		parameters: Type.Object({
			project: Type.Optional(
				Type.String({
					description: "Project name or path (defaults to current directory)",
				}),
			),
		}),
		async execute(_id, params, signal, _onUpdate, ctx) {
			const args = {
				...params,
				project: params.project ?? ctx.cwd,
				repo_path: ctx.cwd,
			};
			const result = await runCbm(pi, cbmBin, "index_status", args, signal);
			return {
				content: [{ type: "text", text: formatResult(result) }],
				details: { result },
			};
		},
	});
}
