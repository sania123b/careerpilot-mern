import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSkills } from "../src/analyzer.js";
test("calculates score and skill groups transparently", () => {
  const r = analyzeSkills(
    "We need a JavaScript React developer with Node.js, MongoDB and testing experience.",
    "JavaScript, React, Git",
  );
  assert.deepEqual(r.requiredSkills, [
    "JavaScript",
    "React",
    "Node.js",
    "MongoDB",
    "Testing",
  ]);
  assert.deepEqual(r.matchedSkills, ["JavaScript", "React"]);
  assert.deepEqual(r.missingSkills, ["Node.js", "MongoDB", "Testing"]);
  assert.equal(r.score, 40);
  assert.match(r.explanation, /2 matched skills \/ 5 detected skills/);
  assert.ok(r.suggestions.length);
});
test("does not invent a percentage when no supported skill is found", () => {
  const r = analyzeSkills(
    "We seek a curious and motivated person to join the team.",
    "Excel",
  );
  assert.equal(r.score, null);
});
test("normalizes aliases", () => {
  const r = analyzeSkills(
    "React and JavaScript required for the role.",
    "React.js, JS",
  );
  assert.equal(r.score, 100);
  assert.deepEqual(r.matchedSkills, ["JavaScript", "React"]);
});
test("validates description length and candidate skills", () => {
  assert.throws(
    () => analyzeSkills("Too short", "React"),
    /at least 30 characters/,
  );
  assert.throws(
    () =>
      analyzeSkills("A sufficiently long job description for the role.", ""),
    /comma-separated list/,
  );
});
