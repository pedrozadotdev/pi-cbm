/**
 * Analysis tools: get_architecture, detect_changes, ingest_traces
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { runCbm, formatResult } from "../cli";

export function registerAnalysisTools(pi: ExtensionAPI, cbmBin: string | null) {
	pi.registerTool({
		name: "cbm_get_architecture",
		label: "CBM: Get Architecture",
		description:
			"Get a high-level architecture overview of the codebase: languages, packages, entry points, HTTP routes, hotspots, module boundaries, layers, and clusters — in a single call.",
		promptSnippet:
			"Get a high-level architecture overview of the codebase from the knowledge graph",
		promptGuidelines: [
			"Use cbm_get_architecture for a quick structural overview of the codebase before diving into details.",
		],
		parameters: Type.Object({
			project: Type.Optional(
				Type.String({
					description:
						"Project name (uses current directory's project if omitted)",
				}),
			),
		}),
		async execute(_id, params, signal, _onUpdate, ctx) {
			const result = await runCbm(
				pi,
				cbmBin,
				"get_architecture",
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

	pi.registerTool({
		name: "cbm_detect_changes",
		label: "CBM: Detect Changes",
		description:
			"Map uncommitted git changes to affected symbols with risk classification. Shows which functions/classes are impacted by current edits.",
		promptSnippet:
			"Analyze git diff to find which symbols are affected by current changes",
		promptGuidelines: [
			"Use cbm_detect_changes to understand the impact of current uncommitted changes before a commit or code review.",
		],
		parameters: Type.Object({}),
		async execute(_id, params, signal, _onUpdate, ctx) {
			const args = { repo_path: ctx.cwd };
			const result = await runCbm(pi, cbmBin, "detect_changes", args, signal);
			return {
				content: [{ type: "text", text: formatResult(result) }],
				details: { result },
			};
		},
	});

	pi.registerTool({
		name: "cbm_ingest_traces",
		label: "CBM: Ingest Traces",
		description:
			"Ingest runtime traces (e.g. OpenTelemetry spans) to validate and enrich HTTP_CALLS edges in the knowledge graph with observed runtime data.",
		promptSnippet:
			"Ingest runtime traces to validate HTTP_CALLS edges in the graph",
		parameters: Type.Object({
			traces: Type.String({
				description: "Runtime trace data to ingest (e.g. JSON array of spans)",
			}),
			project: Type.Optional(
				Type.String({ description: "Project to associate traces with" }),
			),
		}),
		async execute(_id, params, signal, _onUpdate, ctx) {
			const result = await runCbm(
				pi,
				cbmBin,
				"ingest_traces",
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
