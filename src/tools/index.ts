/**
 * Barrel file — registers all 14 codebase-memory-mcp tools.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerIndexingTools } from "./indexing";
import { registerSearchTools } from "./search";
import { registerGraphTools } from "./graph";
import { registerAnalysisTools } from "./analysis";
import { registerManagementTools } from "./management";

export function registerAllTools(pi: ExtensionAPI, cbmBin: string | null) {
  registerIndexingTools(pi, cbmBin);
  registerSearchTools(pi, cbmBin);
  registerGraphTools(pi, cbmBin);
  registerAnalysisTools(pi, cbmBin);
  registerManagementTools(pi, cbmBin);
}
