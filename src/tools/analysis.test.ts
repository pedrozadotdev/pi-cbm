/**
 * Tests for analysis tools (cbm_get_architecture, cbm_detect_changes, cbm_ingest_traces)
 *
 * RED phase: these tests fail because implementations don't auto-derive from ctx.cwd yet.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { ExtensionAPI, ExecResult } from "@earendil-works/pi-coding-agent";
import { pathToProjectName } from "../cli.js";
import { registerAnalysisTools } from "./analysis.js";

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
// cbm_get_architecture
// ---------------------------------------------------------------------------
test("cbm_get_architecture: without project defaults to ctx.cwd", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerAnalysisTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_get_architecture");
	assert.ok(tool);

	const params = {}; // no project
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, FAKE_PROJECT);
});

test("cbm_get_architecture: with explicit project passes through", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerAnalysisTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_get_architecture");
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
// cbm_detect_changes — should always use ctx.cwd (params repo_path/project removed)
// ---------------------------------------------------------------------------
test("cbm_detect_changes: always uses ctx.cwd for repo_path", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerAnalysisTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_detect_changes");
	assert.ok(tool);

	const params = {}; // no params — schema should be empty
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.repo_path, FAKE_CWD, "repo_path should be ctx.cwd");
});

test("cbm_detect_changes: no project/repo_path in schema", async () => {
	// Verify the parameter schema doesn't have repo_path or project
	const { pi, tools } = createMockPi();
	registerAnalysisTools(pi, FAKE_CBM);

	// We need to check the schema — let's re-register with a capturing spy
	let capturedDef: any = null;
	const spyPi = {
		registerTool: (def: any) => {
			if (def.name === "cbm_detect_changes") capturedDef = def;
		},
		exec: async () => ({ code: 0, stdout: "{}", stderr: "", killed: false }),
	} as unknown as ExtensionAPI;

	registerAnalysisTools(spyPi, FAKE_CBM);
	assert.ok(capturedDef);

	const schemaProps = Object.keys(capturedDef.parameters.properties ?? {});
	assert.equal(
		schemaProps.includes("repo_path"),
		false,
		"repo_path should not be in schema",
	);
	assert.equal(
		schemaProps.includes("project"),
		false,
		"project should not be in schema",
	);
});

// ---------------------------------------------------------------------------
// cbm_ingest_traces
// ---------------------------------------------------------------------------
test("cbm_ingest_traces: without project defaults to ctx.cwd", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerAnalysisTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_ingest_traces");
	assert.ok(tool);

	const params = { traces: "[]" }; // no project
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, FAKE_PROJECT);
	assert.equal(parsed.traces, "[]", "other params preserved");
});

test("cbm_ingest_traces: with explicit project passes through", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerAnalysisTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_ingest_traces");
	assert.ok(tool);

	const params = { traces: "[]", project: "other-proj" };
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, "other-proj");
});
