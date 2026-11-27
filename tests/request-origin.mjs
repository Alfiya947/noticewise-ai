import { strict as assert } from "node:assert";
import { test } from "node:test";
import { isSameOriginRequest } from "../lib/request-origin.ts";

const v0Environment = { V0_WORKSPACE_ROOT: "/vercel/share/v0-project" };
const vercelEnvironment = { VERCEL: "1" };

function request(url, headers, environment = {}) {
  return isSameOriginRequest(new Request(url, { headers }), environment);
}

test("accepts a direct same-origin development request", () => {
  assert.equal(request(
    "http://localhost:3000/api/analyze",
    { host: "localhost:3000", origin: "http://localhost:3000" },
  ), true);
});

test("uses the trusted public host and protocol in a v0 preview", () => {
  assert.equal(request(
    "http://127.0.0.1:3000/api/analyze",
    {
      host: "127.0.0.1:3000",
      origin: "https://workspace-preview.v0.build",
      "x-forwarded-host": "workspace-preview.v0.build",
      "x-forwarded-proto": "https",
    },
    v0Environment,
  ), true);
});

test("uses the trusted deployment alias in a Vercel preview", () => {
  assert.equal(request(
    "http://10.0.0.8:3000/api/analyze",
    {
      host: "10.0.0.8:3000",
      origin: "https://noticewise-ai-git-feature-alfiya947.vercel.app",
      "x-forwarded-host": "noticewise-ai-git-feature-alfiya947.vercel.app",
      "x-forwarded-proto": "https",
    },
    vercelEnvironment,
  ), true);
});

test("rejects an origin that differs from the trusted public host", () => {
  assert.equal(request(
    "http://127.0.0.1:3000/api/analyze",
    {
      host: "127.0.0.1:3000",
      origin: "https://attacker.example",
      "x-forwarded-host": "noticewise-ai.vercel.app",
      "x-forwarded-proto": "https",
    },
    vercelEnvironment,
  ), false);
});

test("does not trust forwarded headers outside a known platform runtime", () => {
  assert.equal(request(
    "http://localhost:3000/api/analyze",
    {
      host: "localhost:3000",
      origin: "https://attacker.example",
      "x-forwarded-host": "attacker.example",
      "x-forwarded-proto": "https",
    },
  ), false);
});

test("fails closed for missing origins, invalid protocols, and ambiguous proxy headers", () => {
  assert.equal(request("http://localhost:3000/api/analyze", { host: "localhost:3000" }), false);
  assert.equal(request(
    "http://localhost:3000/api/analyze",
    {
      host: "localhost:3000",
      origin: "https://localhost:3000",
      "x-forwarded-host": "localhost:3000, attacker.example",
      "x-forwarded-proto": "https",
    },
    v0Environment,
  ), false);
  assert.equal(request(
    "http://localhost:3000/api/analyze",
    {
      host: "localhost:3000",
      origin: "https://localhost:3000",
      "x-forwarded-host": "localhost:3000",
      "x-forwarded-proto": "https,http",
    },
    v0Environment,
  ), false);
});
