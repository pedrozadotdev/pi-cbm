/**
 * Tests for graph query tools (cbm_query_graph, cbm_get_graph_schema,
 * cbm_trace_call_path, cbm_get_code_snippet)
 *
 * RED phase: these tests fail because implementations don't auto-derive from ctx.cwd yet.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { ExtensionAPI, ExecResult } from "@earendil-works/pi-coding-agent";
import { pathToProjectName } from "../cli.js";
import { registerGraphTools } from "./graph.js";

const FAKE_CWD = "/fake/project";
const FAKE_PROJECT = pathToProjectName(FAKE_CWD);
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
// cbm_query_graph
// ---------------------------------------------------------------------------
test("cbm_query_graph: without project defaults to ctx.cwd", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerGraphTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_query_graph");
	assert.ok(tool);

	const params = { query: "MATCH (n) RETURN n" }; // no project
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(
		parsed.project,
		FAKE_PROJECT,
		"project should default to ctx.cwd",
	);
	assert.equal(parsed.query, "MATCH (n) RETURN n", "other params preserved");
});

test("cbm_query_graph: with explicit project passes through", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerGraphTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_query_graph");
	assert.ok(tool);

	const params = { query: "MATCH (n) RETURN n", project: "other-proj" };
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, "other-proj");
});

// ---------------------------------------------------------------------------
// cbm_get_graph_schema
// ---------------------------------------------------------------------------
test("cbm_get_graph_schema: without project defaults to ctx.cwd", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerGraphTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_get_graph_schema");
	assert.ok(tool);

	const params = {}; // no project
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, FAKE_PROJECT);
});

test("cbm_get_graph_schema: with explicit project passes through", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerGraphTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_get_graph_schema");
	assert.ok(tool);

	const params = { project: "other-proj" };
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, "other-proj");
});

// ---------------------------------------------------------------------------
// cbm_trace_call_path
// ---------------------------------------------------------------------------
test("cbm_trace_call_path: without project defaults to ctx.cwd", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerGraphTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_trace_call_path");
	assert.ok(tool);

	const params = { function_name: "foo" }; // no project
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, FAKE_PROJECT);
	assert.equal(parsed.function_name, "foo", "other params preserved");
});

test("cbm_trace_call_path: with explicit project passes through", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerGraphTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_trace_call_path");
	assert.ok(tool);

	const params = { function_name: "foo", project: "other-proj" };
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, "other-proj");
});

// ---------------------------------------------------------------------------
// cbm_get_code_snippet — no project param, should remain unchanged
// ---------------------------------------------------------------------------
test("cbm_get_code_snippet: no project param (unchanged)", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerGraphTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_get_code_snippet");
	assert.ok(tool);

	const params = { qualified_name: "myproj.src.utils.foo" };
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.qualified_name, "myproj.src.utils.foo");
	// project should NOT be in the args since it's not in the schema
	assert.equal(
		Object.hasOwn(parsed, "project"),
		false,
		"cbm_get_code_snippet should not have project",
	);
});
