/** Controlled vocabulary — SKILL_ROLE_PASSION_OUTCOME_TAXONOMY.md */

export const DOMAINS = [
  { slug: "design", label: "Design" },
  { slug: "data-analytics", label: "Data & Analytics" },
  { slug: "ai-machine-learning", label: "AI & Machine Learning" },
  { slug: "software-development", label: "Software & Development" },
  { slug: "it-security", label: "IT & Security" },
  { slug: "engineering-emerging-tech", label: "Engineering & Emerging Tech" },
  { slug: "business-automation", label: "Business Automation" },
  { slug: "digital-marketing", label: "Digital Marketing" },
  { slug: "sales-marketing", label: "Sales & Marketing" },
  { slug: "entrepreneurship", label: "Entrepreneurship" },
  { slug: "human-resources", label: "Human Resources" },
  { slug: "finance-procurement", label: "Finance & Procurement" },
  { slug: "project-management", label: "Project Management" },
  { slug: "production-manufacturing", label: "Production & Manufacturing" },
  { slug: "health-safety-environment", label: "Health, Safety & Environment" },
  { slug: "soft-skills-career", label: "Soft Skills & Career" },
] as const;

/** Item-type domains that appear on service/engagement catalogue rows. */
export const ITEM_TYPE_DOMAINS = [
  { slug: "services", label: "Services" },
  { slug: "engagement", label: "Engagement" },
] as const;

export const AUDIENCES = [
  { slug: "student", label: "Student" },
  { slug: "professional", label: "Professional" },
  { slug: "entrepreneur", label: "Entrepreneur" },
  { slug: "organization", label: "Organization" },
] as const;

export const INTENT_TAGS = [
  { slug: "first_job", label: "Get my first job" },
  { slug: "switch_career", label: "Switch careers" },
  { slug: "upskill", label: "Grow in my current role" },
  { slug: "grow_business", label: "Start or grow a business" },
  { slug: "explore", label: "Just exploring" },
  { slug: "solve_problem", label: "Organizational / business problem" },
] as const;

export const PASSION_THEMES = [
  { slug: "building", label: "Making and building things" },
  { slug: "analyzing", label: "Working with data and figuring things out" },
  { slug: "creating", label: "Designing and creative work" },
  { slug: "helping", label: "Teaching, guiding and working with people" },
  { slug: "persuading", label: "Leading, selling and growing ventures" },
  { slug: "organizing", label: "Structuring, planning and improving processes" },
] as const;

export const OUTCOME_TAGS = [
  { slug: "portfolio_ready", label: "Portfolio ready" },
  { slug: "placement_prep", label: "Placement prep" },
  { slug: "certification", label: "Certification" },
  { slug: "business_capability", label: "Business capability" },
  { slug: "foundation", label: "Foundation" },
] as const;

export const LEVELS = [
  { slug: "beginner", label: "Beginner" },
  { slug: "intermediate", label: "Intermediate" },
  { slug: "advanced", label: "Advanced" },
  { slug: "graduate", label: "Graduate" },
] as const;

export const CATALOGUE_LEVELS = [
  ...LEVELS,
  { slug: "mixed", label: "Mixed" },
  { slug: "unspecified", label: "Unspecified" },
  { slug: "n-a", label: "n/a" },
] as const;

export const DELIVERY_MODES = [
  { slug: "online", label: "Online" },
  { slug: "in_person", label: "In person" },
  { slug: "hybrid", label: "Hybrid" },
] as const;

export const TRACKS = [
  { slug: "ui-ux-design", itemId: "TRK-UIUX", name: "UI/UX Design Track" },
  { slug: "data-analytics", itemId: "TRK-DATA", name: "Data Analytics Track" },
  { slug: "software-dev", itemId: "TRK-DEV", name: "Software & Development Track" },
  { slug: "career-accelerator", itemId: "TRK-ACCEL", name: "Career Accelerator Track" },
] as const;

export const ITEM_ID_PATTERN = /^(CRS-\d{3}|TRK-[A-Z]+|SVC-[A-Z]+|ENG-[A-Z]+)$/;

const byLabel = <T extends { slug: string; label: string }>(rows: readonly T[]) =>
  new Map(rows.map((row) => [row.label.toLowerCase(), row.slug]));

export const DOMAIN_SLUG_BY_LABEL = byLabel([...DOMAINS, ...ITEM_TYPE_DOMAINS]);
export const LEVEL_SLUG_BY_LABEL = byLabel(CATALOGUE_LEVELS);
export const AUDIENCE_SLUGS: ReadonlySet<string> = new Set(AUDIENCES.map((a) => a.slug));
export const INTENT_SLUGS: ReadonlySet<string> = new Set(INTENT_TAGS.map((a) => a.slug));
export const PASSION_SLUGS: ReadonlySet<string> = new Set(PASSION_THEMES.map((a) => a.slug));
export const DELIVERY_SLUGS: ReadonlySet<string> = new Set(DELIVERY_MODES.map((a) => a.slug));
