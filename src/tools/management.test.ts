/**
 * Tests for management tools (cbm_list_projects, cbm_delete_project, cbm_manage_adr)
 *
 * RED phase: these tests fail because implementations don't auto-derive from ctx.cwd yet.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { ExtensionAPI, ExecResult } from "@earendil-works/pi-coding-agent";
import { pathToProjectName } from "../cli.js";
import { registerManagementTools } from "./management.js";

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
// cbm_list_projects — no params, no change expected
// ---------------------------------------------------------------------------
test("cbm_list_projects: no params (unchanged)", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerManagementTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_list_projects");
	assert.ok(tool);

	await tool.execute("test-id", {}, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.deepEqual(parsed, {}, "no params should be passed");
});

// ---------------------------------------------------------------------------
// cbm_delete_project
// ---------------------------------------------------------------------------
test("cbm_delete_project: without project defaults to ctx.cwd", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerManagementTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_delete_project");
	assert.ok(tool);

	const params = {}; // no project
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, FAKE_PROJECT);
});

test("cbm_delete_project: with explicit project passes through", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerManagementTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_delete_project");
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
// cbm_manage_adr
// ---------------------------------------------------------------------------
test("cbm_manage_adr: without project defaults to ctx.cwd", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerManagementTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_manage_adr");
	assert.ok(tool);

	const params = { action: "list" }; // no project
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, FAKE_PROJECT);
	assert.equal(parsed.action, "list", "other params preserved");
});

test("cbm_manage_adr: with explicit project passes through", async () => {
	const { pi, tools, execCalls } = createMockPi();
	registerManagementTools(pi, FAKE_CBM);

	const tool = tools.get("cbm_manage_adr");
	assert.ok(tool);

	const params = { action: "list", project: "other-proj" };
	await tool.execute("test-id", params, undefined, undefined, {
		cwd: FAKE_CWD,
	} as any);

	assert.equal(execCalls.length, 1);
	const parsed = parseExecArgs(execCalls[0].args);
	assert.equal(parsed.project, "other-proj");
});
