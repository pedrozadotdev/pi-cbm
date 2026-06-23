/**
 * Management tools: list_projects, delete_project, manage_adr
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { runCbm, formatResult } from "../cli";

export function registerManagementTools(
	pi: ExtensionAPI,
	cbmBin: string | null,
) {
	pi.registerTool({
		name: "cbm_list_projects",
		label: "CBM: List Projects",
		description:
			"List all repositories that have been indexed into the knowledge graph, with their paths, last indexed time, and file counts.",
		promptSnippet: "List all indexed projects in the codebase knowledge graph",
		parameters: Type.Object({}),
		async execute(_id, _params, signal) {
			const result = await runCbm(pi, cbmBin, "list_projects", {}, signal);
			return {
				content: [{ type: "text", text: formatResult(result) }],
				details: { result },
			};
		},
	});

	pi.registerTool({
		name: "cbm_delete_project",
		label: "CBM: Delete Project",
		description:
			"Remove a project's index from the knowledge graph. The source files are not deleted, only the graph data.",
		promptSnippet: "Remove a project's graph index from codebase-memory-mcp",
		parameters: Type.Object({
			project: Type.Optional(
				Type.String({
					description:
						"Project name or path to remove from the index (defaults to current directory)",
				}),
			),
		}),
		async execute(_id, params, signal, _onUpdate, ctx) {
			const project = params.project ?? ctx.cwd;
			const result = await runCbm(
				pi,
				cbmBin,
				"delete_project",
				{ project },
				signal,
			);
			return {
				content: [{ type: "text", text: formatResult(result) }],
				details: { result },
			};
		},
	});

	pi.registerTool({
		name: "cbm_manage_adr",
		label: "CBM: Manage ADR",
		description:
			"Manage Architecture Decision Records (ADRs) — create, list, update, or query architectural decisions that persist across sessions in the knowledge graph.",
		promptSnippet:
			"Create and manage Architecture Decision Records (ADRs) in the knowledge graph",
		parameters: Type.Object({
			action: Type.String({
				description: "Action: 'list', 'create', 'update', 'get', 'search'",
			}),
			title: Type.Optional(
				Type.String({ description: "ADR title (for create/update)" }),
			),
			content: Type.Optional(
				Type.String({ description: "ADR content/body (for create/update)" }),
			),
			id: Type.Optional(
				Type.String({ description: "ADR ID (for get/update)" }),
			),
			query: Type.Optional(
				Type.String({ description: "Search query (for search action)" }),
			),
			project: Type.Optional(
				Type.String({ description: "Project to scope ADRs to" }),
			),
		}),
		async execute(_id, params, signal, _onUpdate, ctx) {
			const result = await runCbm(
				pi,
				cbmBin,
				"manage_adr",
				{
					...params,
					project: params.project ?? ctx.cwd,
				},
				signal,
			);
			return {
				content: [{ type: "text", text: formatResult(result) }],
				details: { result },
			};
		},
	});
}
