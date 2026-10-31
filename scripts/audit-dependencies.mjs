import { spawnSync } from "node:child_process";

const allowedAdvisories = new Set([
  "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm",
  "https://github.com/advisories/GHSA-rj75-hqrm-r3gf",

  // Temporary development-only exception:
  // GHSA-g3hv-75wg-m249 affects the legacy ESLint minimatch dependency tree.
  // Production audit remains separately enforced in CI.
  // Reassess when ESLint publishes a compatible patched dependency.
  "https://github.com/advisories/GHSA-g3hv-75wg-m249",
]);

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(command, ["audit", "--json"], {
  encoding: "utf8",
  shell: process.platform === "win32",
  maxBuffer: 10 * 1024 * 1024,
});

if (result.error) {
  console.error("Could not run pnpm audit:", result.error.message);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error("Could not parse pnpm audit JSON.");
  console.error(result.stderr || result.stdout);
  process.exit(1);
}

if (!report.advisories || typeof report.advisories !== "object") {
  console.error("Unexpected audit report format; failing closed.");
  process.exit(1);
}

const advisories = Object.values(report.advisories);
const unexpected = advisories.filter(
  (advisory) => !allowedAdvisories.has(advisory.url),
);

for (const advisory of advisories) {
  const status = allowedAdvisories.has(advisory.url)
    ? "KNOWN EXCEPTION"
    : "UNEXPECTED";
  console.log(
    `[${status}] ${advisory.severity}: ${advisory.module_name} — ${advisory.title}`,
  );
  console.log(`  ${advisory.url}`);
}

if (unexpected.length > 0) {
  console.error(
    `Audit failed: ${unexpected.length} unapproved advisory/advisories found.`,
  );
  process.exit(1);
}

console.log(
  advisories.length
    ? "Audit passed with only the explicitly allowlisted advisories."
    : "Audit passed with no advisories.",
);
