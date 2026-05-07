/**
 * Lifecycle event hooks:
 *   - session_start      → check binary + index status, show footer
 *   - before_agent_start → inject system-prompt instructions (≈ CLAUDE.md)
 *   - tool_call          → advisory nudge toward graph tools (≈ PreToolUse)
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { SYSTEM_PROMPT_INSTRUCTIONS } from "./instructions.js";

export function registerHooks(pi: ExtensionAPI, cbmBin: string | null) {
  // ---------------------------------------------------------------------------
  // session_start — binary check + index-status footer
  // ---------------------------------------------------------------------------
  pi.on("session_start", async (_event, ctx) => {
    if (!cbmBin) {
      ctx.ui.notify(
        "codebase-memory-mcp not found in PATH. " +
          "Install from https://github.com/DeusData/codebase-memory-mcp",
        "warning"
      );
      return;
    }

    try {
      const result = await pi.exec(
        cbmBin,
        ["cli", "--raw", "list_projects", "{}"],
        { timeout: 10_000 }
      );

      if (result.code === 0 && result.stdout) {
        const data = JSON.parse(result.stdout.trim()) as {
          projects?: Array<{ path?: string; name?: string }>;
        };
        const cwd = ctx.cwd;
        const isIndexed = data.projects?.some(
          (p) => p.path === cwd || cwd.startsWith(p.path ?? "")
        );

        ctx.ui.setStatus(
          "cbm",
          isIndexed
            ? "⚡ cbm: ready"
            : "⚡ cbm: not indexed — use cbm_index_repository"
        );
      }
    } catch {
      // silently skip — binary may not support list_projects or JSON yet
    }
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

  // ---------------------------------------------------------------------------
  // tool_call — advisory hook (equivalent to PreToolUse, exit 0 / non-blocking)
  //
  // The system prompt already guides the agent. This hook is a structural
  // placeholder: extend it to inject steering messages via pi.sendMessage()
  // if you want stronger nudging without blocking the original tool call.
  // ---------------------------------------------------------------------------
  pi.on("tool_call", async (event, _ctx) => {
    if (!cbmBin) return;

    if (
      event.toolName === "grep" ||
      event.toolName === "find" ||
      event.toolName === "read"
    ) {
      // Advisory only — allow the call through.
      // The system-prompt instructions already tell the agent to prefer cbm_ tools.
      return undefined;
    }

    return undefined;
  });
}
