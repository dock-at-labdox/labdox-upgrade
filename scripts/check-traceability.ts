/**
 * Sprint 0 stub: fail if the P0 inventory CSV is present and a feature has no test id.
 * The inventory lives in the docs suite until it is copied into this repo.
 */
const inventoryHint =
  process.env.TRACEABILITY_CSV ??
  "../docs/labdox-website-upgrade/01-product/MODULE_FEATURE_AND_ACCEPTANCE_INVENTORY.csv";

console.log(`Traceability gate stub (Sprint 0). Inventory path when wired: ${inventoryHint}`);
process.exit(0);
