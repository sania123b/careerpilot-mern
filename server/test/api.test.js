import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

test("API health, not-found, validation, and analyzer routes respond", async (context) => {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  context.after(() => new Promise((resolve, reject) => { server.closeAllConnections(); server.close((error) => error ? reject(error) : resolve()); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "ok");
  const missing = await fetch(`${base}/unknown`);
  assert.equal(missing.status, 404);
  const invalid = await fetch(`${base}/api/applications`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ company: "" }) });
  assert.equal(invalid.status, 400);
  const analyzed = await fetch(`${base}/api/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobDescription: "We need a JavaScript developer with React experience and Node.js knowledge.", candidateSkills: "React, JS" }) });
  assert.equal(analyzed.status, 200);
  assert.equal((await analyzed.json()).score, 67);
});
