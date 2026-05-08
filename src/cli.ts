/**
 * CLI runner — detects the codebase-memory-mcp binary and provides a typed
 * helper to invoke `codebase-memory-mcp cli <tool> '<json>'`.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Detect the codebase-memory-mcp binary from PATH. Returns the command name or null. */
export async function detectBinary(pi: ExtensionAPI): Promise<string | null> {
  try {
    const result = await pi.exec("which", ["codebase-memory-mcp"], {
      timeout: 5_000,
    });
    if (result.code === 0 && result.stdout?.trim()) {
      return "codebase-memory-mcp";
    }
  } catch {
    // binary not found in PATH
  }
  return null;
}

/**
 * Run `codebase-memory-mcp cli <tool> '<json>'` and return parsed output.
 *
 * Throws on non-zero exit code so Pi marks the tool result as `isError: true`.
 */
export async function runCbm(
  pi: ExtensionAPI,
  cbmBin: string | null,
  tool: string,
  args: Record<string, unknown>,
  signal?: AbortSignal
): Promise<unknown> {
  if (!cbmBin) {
    throw new Error(
      "codebase-memory-mcp binary not found in PATH. " +
        "Install it from https://github.com/DeusData/codebase-memory-mcp and ensure it is in your PATH."
    );
  }

  const jsonArgs = JSON.stringify(args);
  const result = await pi.exec(cbmBin, ["cli", tool, jsonArgs], {
    signal,
    timeout: 120_000, // 2 min max (indexing can be slow)
  });

  if (result.code !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(
      stderr ||
        `codebase-memory-mcp cli ${tool} failed with exit code ${result.code}`
    );
  }

  const stdout = result.stdout?.trim();
  if (!stdout) return {};

  try {
    return JSON.parse(stdout);
  } catch {
    // Return raw text wrapped in an object if it's not valid JSON
    return { output: stdout };
  }
}

/** Convenience: stringify a result for the LLM content block. */
export function formatResult(result: unknown): string {
  if (typeof result === "object" && result !== null) {
    return JSON.stringify(result, null, 2);
  }
  return String(result);
}
