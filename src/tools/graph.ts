/**
 * Graph query tools: query_graph, get_graph_schema, trace_call_path, get_code_snippet
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { runCbm, formatResult } from "../cli";

export function registerGraphTools(
  pi: ExtensionAPI,
  cbmBin: string | null
) {
  pi.registerTool({
    name: "cbm_query_graph",
    label: "CBM: Query Graph (Cypher)",
    description:
      "Execute a Cypher-like query against the knowledge graph. Supports MATCH, WHERE, RETURN, ORDER BY, LIMIT. Example: MATCH (f:Function)-[:CALLS]->(g) WHERE f.name = 'main' RETURN g.name",
    promptSnippet:
      "Execute Cypher-like queries against the code knowledge graph",
    promptGuidelines: [
      "Use cbm_query_graph for custom Cypher-like queries when cbm_search_graph or cbm_trace_call_path are not expressive enough.",
    ],
    parameters: Type.Object({
      query: Type.String({
        description:
          "Cypher-like query. Supported: MATCH with labels and relationship types, WHERE with comparisons/regex/CONTAINS, RETURN with property access and COUNT/DISTINCT, ORDER BY, LIMIT.",
      }),
      project: Type.Optional(
        Type.String({ description: "Limit query to a specific project" })
      ),
    }),
    async execute(_id, params, signal) {
      const result = await runCbm(pi, cbmBin, "query_graph", params, signal);
      return {
        content: [{ type: "text", text: formatResult(result) }],
        details: { result },
      };
    },
  });

  pi.registerTool({
    name: "cbm_get_graph_schema",
    label: "CBM: Get Graph Schema",
    description:
      "Get the schema of the knowledge graph: available node labels, edge types, and their properties. Useful before writing Cypher queries.",
    promptSnippet:
      "Get the knowledge graph schema (node labels, edge types)",
    parameters: Type.Object({
      project: Type.Optional(
        Type.String({ description: "Limit to a specific project" })
      ),
    }),
    async execute(_id, params, signal) {
      const result = await runCbm(
        pi,
        cbmBin,
        "get_graph_schema",
        params,
        signal
      );
      return {
        content: [{ type: "text", text: formatResult(result) }],
        details: { result },
      };
    },
  });

  pi.registerTool({
    name: "cbm_trace_call_path",
    label: "CBM: Trace Call Path",
    description:
      "Trace call graph paths for a function — inbound callers, outbound callees, or both. Use this instead of reading files to understand call chains.",
    promptSnippet:
      "Trace who calls a function and what it calls (call graph traversal)",
    promptGuidelines: [
      "Use cbm_trace_call_path to answer 'what calls X?' (direction='inbound') or 'what does X call?' (direction='outbound').",
    ],
    parameters: Type.Object({
      function_name: Type.String({
        description: "Name of the function to trace",
      }),
      direction: Type.Optional(
        Type.String({
          description:
            "Direction: 'inbound' (callers), 'outbound' (callees), 'both' (default: 'both')",
        })
      ),
      depth: Type.Optional(
        Type.Number({ description: "Maximum traversal depth (default: 3)" })
      ),
      project: Type.Optional(
        Type.String({ description: "Limit to a specific project" })
      ),
    }),
    async execute(_id, params, signal) {
      const result = await runCbm(
        pi,
        cbmBin,
        "trace_call_path",
        params,
        signal
      );
      return {
        content: [{ type: "text", text: formatResult(result) }],
        details: { result },
      };
    },
  });

  pi.registerTool({
    name: "cbm_get_code_snippet",
    label: "CBM: Get Code Snippet",
    description:
      "Get the source code snippet for a symbol by its qualified name (e.g. myproject.src.handlers.ProcessOrder). Use cbm_search_graph first to discover qualified names.",
    promptSnippet:
      "Get source code for a symbol by its qualified name from the knowledge graph",
    promptGuidelines: [
      "Use cbm_get_code_snippet to retrieve source code for a specific symbol instead of reading the whole file with read.",
    ],
    parameters: Type.Object({
      qualified_name: Type.String({
        description:
          "Qualified name of the symbol: <project>.<path_parts>.<name>. Use cbm_search_graph to discover names first.",
      }),
    }),
    async execute(_id, params, signal) {
      const result = await runCbm(
        pi,
        cbmBin,
        "get_code_snippet",
        params,
        signal
      );
      return {
        content: [{ type: "text", text: formatResult(result) }],
        details: { result },
      };
    },
  });
}
