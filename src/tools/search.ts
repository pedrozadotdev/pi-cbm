/**
 * Search tools: search_graph, search_code
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { runCbm, formatResult, pathToProjectName } from "../cli";

export function registerSearchTools(pi: ExtensionAPI, cbmBin: string | null) {
	pi.registerTool({
		name: "cbm_search_graph",
		label: "CBM: Search Graph",
		description:
			"Structural search over the knowledge graph. Use regex name patterns, label filters (Function, Class, Method, etc.), min/max degree, and file scoping. Prefer this over grep for finding symbols.",
		promptSnippet:
			"Structural search for symbols (functions, classes, etc.) in the knowledge graph",
		promptGuidelines: [
			"Use cbm_search_graph instead of grep when searching for functions, classes, methods, or other symbols by name or pattern.",
			"Use cbm_search_graph with label='Function' to find all functions, label='Class' for classes, etc.",
		],
		parameters: Type.Object({
			name_pattern: Type.Optional(
				Type.String({
					description: "Regex pattern to match node names (e.g. '.*Handler.*')",
				}),
			),
			label: Type.Optional(
				Type.String({
					description:
						"Node label filter: Function, Class, Method, Interface, Enum, Type, Route, File, Package, Module, Resource",
				}),
			),
			project: Type.Optional(
				Type.String({ description: "Limit search to a specific project name" }),
			),
			file_path: Type.Optional(
				Type.String({
					description: "Limit search to nodes defined in this file path",
				}),
			),
			min_degree: Type.Optional(
				Type.Number({ description: "Minimum number of edges (connections)" }),
			),
			max_degree: Type.Optional(
				Type.Number({ description: "Maximum number of edges (connections)" }),
			),
			limit: Type.Optional(
				Type.Number({ description: "Maximum results to return (default: 50)" }),
			),
		}),
		async execute(_id, params, signal, _onUpdate, ctx) {
			const result = await runCbm(
				pi,
				cbmBin,
				"search_graph",
				{
					...params,
					project: params.project ?? pathToProjectName(ctx.cwd),
				},
				signal,
			);
			return {
				content: [{ type: "text", text: formatResult(result) }],
				details: { result },
			};
		},
	});

	pi.registerTool({
		name: "cbm_search_code",
		label: "CBM: Search Code",
		description:
			"Graph-augmented grep over indexed source files. Searches only files known to the graph, with contextual results. Prefer cbm_search_graph for symbol lookups; use this for literal text/regex in source.",
		promptSnippet:
			"Text/regex search over indexed source files (graph-augmented grep)",
		parameters: Type.Object({
			pattern: Type.String({
				description: "Text or regex pattern to search for in source files",
			}),
			project: Type.Optional(
				Type.String({ description: "Limit search to a specific project" }),
			),
			file_pattern: Type.Optional(
				Type.String({
					description: "Glob pattern to limit which files are searched",
				}),
			),
			case_sensitive: Type.Optional(
				Type.Boolean({
					description: "Whether the search is case-sensitive (default: false)",
				}),
			),
			limit: Type.Optional(
				Type.Number({ description: "Maximum results to return (default: 50)" }),
			),
		}),
		async execute(_id, params, signal, _onUpdate, ctx) {
			const result = await runCbm(
				pi,
				cbmBin,
				"search_code",
				{
					...params,
					project: params.project ?? pathToProjectName(ctx.cwd),
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
