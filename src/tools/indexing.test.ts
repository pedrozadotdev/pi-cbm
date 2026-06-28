/**
 * Tests for indexing tools (cbm_index_repository, cbm_index_status)
 *
 * RED phase: these tests fail because implementations don't auto-derive from ctx.cwd yet.
 */

import { test, mock } from "node:test";
import assert from "node:assert/strict";
import type { ExtensionAPI, ExecResult } from "@earendil-works/pi-coding-agent";
import { pathToProjectName } from "../cli.js";
import { registerIndexingTools } from "./indexing.js";

const FAKE_CWD = "/fake/project";
const FAKE_PROJECT = pathToProjectName(FAKE_CWD);
const FAKE_CBM = "test-cbm";

/** Parse the JSON args from a pi.exec call to cbm cli tool */
function parseExecArgs(args: string[]): Record<string, unknown> {
	// args = ["cli", "<tool_name>", "<json_args>"]
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
// cbm_index_repository
// ---------------------------------------------------------------------------
test("cbm_index_repository: without repo_path defaults to ctx.cwd", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerIndexingTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_index_repository");
	assert.ok(tool, "cbm_index_repository not registered");

	const params = {}; // no repo_path
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1, "expected 1 exec call");
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(
		parsed.repo_path,
		FAKE_CWD,
		"repo_path should default to ctx.cwd",
	);
});

test("cbm_index_repository: with explicit repo_path passes through", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerIndexingTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_index_repository");
	assert.ok(tool);

	const params = { repo_path: "/custom/path" };
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.repo_path, "/custom/path");
});

// ---------------------------------------------------------------------------
// cbm_index_status
// ---------------------------------------------------------------------------
test("cbm_index_status: without project defaults to ctx.cwd", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerIndexingTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_index_status");
	assert.ok(tool);

	const params = {}; // no project
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
});

test("cbm_index_status: with explicit project passes through", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerIndexingTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_index_status");
	assert.ok(tool);

	const params = { project: "my-other-project" };
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, "my-other-project");
});
