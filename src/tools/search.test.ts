/**
 * Tests for search tools (cbm_search_graph, cbm_search_code)
 *
 * RED phase: these tests fail because implementations don't auto-derive from ctx.cwd yet.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { ExtensionAPI, ExecResult } from "@earendil-works/pi-coding-agent";
import { registerSearchTools } from "./search.js";

const FAKE_CWD = "/fake/project";
const FAKE_CBM = "test-cbm";

function parseExecArgs(args: string[]): Record<string, unknown> {
	return JSON.parse(args[2]) as Record<string, unknown>;
}

interface MockPi {
	pi: ExtensionAPI;
	tools: Map<string, { execute: Function; name: string }>;
	execCalls: Array<{ cmd: string; args: string[] }>;
}

function createMockPi(): MockPi {
	const tools = new Map();
	const execCalls: Array<{ cmd: string; args: string[] }> = [];

	const pi = {
		registerTool: (def: any) => {
			tools.set(def.name, { execute: def.execute, name: def.name });
		},
		exec: async (
			_cmd: string,
			_args: string[],
			_opts?: any,
		): Promise<ExecResult> => {
			execCalls.push({ cmd: _cmd, args: _args });
			return { code: 0, stdout: "{}", stderr: "", killed: false };
		},
	} as unknown as ExtensionAPI;

	return { pi, tools, execCalls };
}

// ---------------------------------------------------------------------------
// cbm_search_graph
// ---------------------------------------------------------------------------
test("cbm_search_graph: without project defaults to ctx.cwd", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerSearchTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_search_graph");
	assert.ok(tool);

	const params = { name_pattern: ".*Handler.*" }; // no project
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, FAKE_CWD, "project should default to ctx.cwd");
	assert.equal(parsed.name_pattern, ".*Handler.*", "other params preserved");
});

test("cbm_search_graph: with explicit project passes through", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerSearchTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_search_graph");
	assert.ok(tool);

	const params = { project: "override-project" };
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, "override-project");
});

// ---------------------------------------------------------------------------
// cbm_search_code
// ---------------------------------------------------------------------------
test("cbm_search_code: without project defaults to ctx.cwd", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerSearchTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_search_code");
	assert.ok(tool);

	const params = { pattern: "someFunction" }; // no project
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, FAKE_CWD, "project should default to ctx.cwd");
	assert.equal(parsed.pattern, "someFunction", "other params preserved");
});

test("cbm_search_code: with explicit project passes through", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerSearchTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_search_code");
	assert.ok(tool);

	const params = { pattern: "foo", project: "override-project" };
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, "override-project");
});
