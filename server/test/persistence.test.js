import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import JobApplication from "../src/models/JobApplication.js";

test("persists application CRUD and analytics in MongoDB", { skip: !process.env.MONGODB_TEST_URI }, async (context) => {
  await mongoose.connect(process.env.MONGODB_TEST_URI, { serverSelectionTimeoutMS: 5000 });
  const marker = `CareerPilot test ${Date.now()}`;
  let createdId;
  const server = createApp().listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  context.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (createdId) await JobApplication.findByIdAndDelete(createdId);
    await mongoose.disconnect();
  });
  const before = await (await fetch(`${base}/api/analytics`)).json();
  const createdResponse = await fetch(`${base}/api/applications`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ company: marker, role: "Software Engineer Intern", location: "Remote", status: "Applied", notes: "Created by automated test" }) });
  assert.equal(createdResponse.status, 201);
  const created = (await createdResponse.json()).application;
  createdId = created._id;
  assert.equal(created.company, marker);
  const list = await (await fetch(`${base}/api/applications`)).json();
  assert.ok(list.applications.some(application => application._id === createdId));
  const updatedResponse = await fetch(`${base}/api/applications/${createdId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "Interview" }) });
  assert.equal(updatedResponse.status, 200);
  assert.equal((await updatedResponse.json()).application.status, "Interview");
  const analytics = await (await fetch(`${base}/api/analytics`)).json();
  assert.equal(analytics.total, before.total + 1);
  assert.equal(analytics.interviews, before.interviews + 1);
  const deletedResponse = await fetch(`${base}/api/applications/${createdId}`, { method: "DELETE" });
  assert.equal(deletedResponse.status, 200);
  createdId = undefined;
  assert.equal((await (await fetch(`${base}/api/applications`)).json()).applications.some(application => application._id === created._id), false);
});
