/**
 * Pi Agent Extension for codebase-memory-mcp (CLI Mode)
 *
 * Integrates codebase-memory-mcp into Pi by:
 * 1. Registering 14 custom tools that invoke `codebase-memory-mcp cli <tool>` via pi.exec()
 * 2. Injecting system prompt instructions (equivalent to Claude Code's CLAUDE.md/instructions)
 * 3. Providing advisory tool hooks on grep/find/read (equivalent to Claude Code's PreToolUse hooks)
 *
 * Install as a Pi package:
 *   pi install npm:pi-cbm
 *
 * Or place in extensions dir:
 *   ~/.pi/agent/extensions/pi-cbm/
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { detectBinary } from "./cli.js";
import { registerHooks } from "./hooks.js";
import { registerAllTools } from "./tools/index.js";
import { registerCommands } from "./commands.js";

export default async function (pi: ExtensionAPI) {
  const cbmBin = await detectBinary(pi);

  registerHooks(pi, cbmBin);
  registerAllTools(pi, cbmBin);
  registerCommands(pi, cbmBin);
}
