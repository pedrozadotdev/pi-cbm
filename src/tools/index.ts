/**
 * Barrel file — registers all 14 codebase-memory-mcp tools.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerIndexingTools } from "./indexing.js";
import { registerSearchTools } from "./search.js";
import { registerGraphTools } from "./graph.js";
import { registerAnalysisTools } from "./analysis.js";
import { registerManagementTools } from "./management.js";

export function registerAllTools(pi: ExtensionAPI, cbmBin: string | null) {
  registerIndexingTools(pi, cbmBin);
  registerSearchTools(pi, cbmBin);
  registerGraphTools(pi, cbmBin);
  registerAnalysisTools(pi, cbmBin);
  registerManagementTools(pi, cbmBin);
}
