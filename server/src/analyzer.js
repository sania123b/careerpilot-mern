const SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Express",
  "MongoDB",
  "Mongoose",
  "HTML",
  "CSS",
  "REST APIs",
  "Git",
  "SQL",
  "Python",
  "Java",
  "C++",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "Next.js",
  "Redux",
  "Testing",
  "Jest",
  "CI/CD",
  "Agile",
  "Communication",
  "Problem solving",
  "Data structures",
  "Algorithms",
  "System design",
  "Authentication",
  "Accessibility",
  "Figma",
  "Leadership",
];
const ALIASES = new Map([
  ["js", "JavaScript"],
  ["ts", "TypeScript"],
  ["react.js", "React"],
  ["reactjs", "React"],
  ["node", "Node.js"],
  ["nodejs", "Node.js"],
  ["express.js", "Express"],
  ["mongo", "MongoDB"],
  ["html5", "HTML"],
  ["css3", "CSS"],
  ["rest", "REST APIs"],
  ["rest api", "REST APIs"],
  ["restful", "REST APIs"],
  ["problem-solving", "Problem solving"],
  ["unit testing", "Testing"],
  ["algorithm", "Algorithms"],
]);
function appears(text, skill) {
  const escaped = skill
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\ /g, "\\s+");
  return new RegExp(`(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#.])`, "i").test(
    text,
  );
}
export function analyzeSkills(jobDescription, candidateSkills = "") {
  const description = String(jobDescription ?? "").trim();
  const candidate = String(candidateSkills ?? "").trim();
  if (description.length < 30) {
    const error = new Error(
      "Add a job description with at least 30 characters.",
    );
    error.status = 400;
    throw error;
  }
  if (!candidate) {
    const error = new Error("Add your skills as a comma-separated list.");
    error.status = 400;
    throw error;
  }
  const requiredSkills = SKILLS.filter((skill) => appears(description, skill));
  const found = new Set();
  for (const [alias, canonical] of ALIASES)
    if (appears(candidate.toLowerCase(), alias)) found.add(canonical);
  for (const skill of SKILLS)
    if (appears(candidate.toLowerCase(), skill.toLowerCase())) found.add(skill);
  const matchedSkills = requiredSkills.filter((skill) => found.has(skill));
  const missingSkills = requiredSkills.filter((skill) => !found.has(skill));
  const score = requiredSkills.length
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : null;
  const suggestions = missingSkills
    .slice(0, 4)
    .map(
      (skill) =>
        `Build a small project that uses ${skill} and add a concrete result to your portfolio.`,
    );
  if (!requiredSkills.length)
    suggestions.push(
      "No supported skills were detected. Review the description and add your skills manually to compare.",
    );
  else if (!missingSkills.length)
    suggestions.push(
      "Your listed skills cover every skill detected here. Tailor your examples to the responsibilities in the role.",
    );
  else if (missingSkills.length > 4)
    suggestions.push(
      `Prioritize the first two missing skills for this role: ${missingSkills.slice(0, 2).join(" and ")}.`,
    );
  return {
    score,
    matchedSkills,
    missingSkills,
    requiredSkills,
    suggestions,
    explanation: requiredSkills.length
      ? `Score = ${matchedSkills.length} matched skills / ${requiredSkills.length} detected skills x 100. All detected skills are weighted equally.`
      : "No supported skills were detected, so a meaningful percentage cannot be calculated.",
    note: "This keyword-based estimate checks listed skills only. It does not assess experience, proficiency, or context.",
  };
}
