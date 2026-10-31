import fs from "node:fs";
import path from "node:path";

function fail(message: string): never {
  console.error(`Traceability check failed: ${message}`);
  process.exit(1);
}

function parseCsv(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (quoted) fail("CSV contains an unclosed quoted field.");

  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);

  return rows;
}

const configuredPath = process.env.TRACEABILITY_CSV;
const defaultPath = path.resolve(
  process.cwd(),
  "../docs/labdox-website-upgrade/01-product/MODULE_FEATURE_AND_ACCEPTANCE_INVENTORY.csv",
);
const inventoryPath = path.resolve(configuredPath || defaultPath);

if (!fs.existsSync(inventoryPath)) {
  if (configuredPath) {
    fail(`Inventory not found at "${inventoryPath}". Check TRACEABILITY_CSV.`);
  }

  console.warn(
    "Traceability check skipped: the authoritative inventory is not available in this checkout. Set TRACEABILITY_CSV to validate it.",
  );
  process.exit(0);
}

const rows = parseCsv(fs.readFileSync(inventoryPath, "utf8"));
if (rows.length < 2)
  fail("Inventory must contain a header and at least one feature.");

const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
const requiredHeaders = [
  "Module ID",
  "Feature ID",
  "Priority",
  "Release",
  "Acceptance Criterion",
  "Status",
];

const missingHeaders = requiredHeaders.filter(
  (header) => !headers.includes(header),
);
if (missingHeaders.length) {
  fail(`Missing required CSV columns: ${missingHeaders.join(", ")}`);
}

const index = (name: string) => headers.indexOf(name);
const features = rows.slice(1).map((values, rowIndex) => {
  if (values.length !== headers.length) {
    fail(
      `CSV row ${rowIndex + 2} has ${values.length} columns; expected ${headers.length}.`,
    );
  }

  return Object.fromEntries(
    headers.map((header, i) => [header, values[i].trim()]),
  );
});

const seen = new Set<string>();
const duplicates: string[] = [];

for (const feature of features) {
  const id = feature["Feature ID"];
  if (!id) fail("A feature row has an empty Feature ID.");

  if (seen.has(id)) duplicates.push(id);
  seen.add(id);

  if (feature.Priority === "P0" && !feature["Acceptance Criterion"]) {
    fail(`P0 feature "${id}" has no acceptance criterion.`);
  }

  if (!feature["Module ID"] || !feature.Release || !feature.Status) {
    fail(`Feature "${id}" is missing Module ID, Release, or Status.`);
  }
}

if (duplicates.length) {
  fail(`Duplicate Feature IDs: ${[...new Set(duplicates)].join(", ")}`);
}

const requiredFeatureId = process.env.TRACEABILITY_REQUIRED_FEATURE_ID;

if (requiredFeatureId && !seen.has(requiredFeatureId)) {
  fail(
    `Required feature "${requiredFeatureId}" is absent from the inventory. Update the authoritative inventory; do not invent a replacement entry.`,
  );
}

console.log(
  `Inventory validation passed: ${features.length} features checked at ${inventoryPath}`,
);
console.log(
  "Note: the CSV has no test-mapping column; this validates inventory integrity, not feature-to-test coverage.",
);
