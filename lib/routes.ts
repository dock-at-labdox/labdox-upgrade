export const HEADER_NAV = [
  { href: "/explore-courses", label: "Explore" },
  { href: "/discover-your-path", label: "Discover" },
  { href: "/organizations", label: "Organizations" },
  { href: "/about", label: "About" },
  { href: "/resources", label: "Resources" },
] as const;

export const HEADER_CTA = { href: "/discover-your-path", label: "Find my path" } as const;

export const FOOTER_GROUPS = [
  {
    title: "Learn",
    links: [
      { href: "/courses", label: "Courses" },
      { href: "/tracks/ui-ux-design", label: "UI/UX Design" },
      { href: "/tracks/data-analytics", label: "Data Analytics" },
      { href: "/tracks/software-dev", label: "Software & Development" },
      { href: "/tracks/career-accelerator", label: "Career Accelerator" },
      { href: "/services", label: "Services" },
    ],
  },
  {
    title: "Discover",
    links: [
      { href: "/discover-your-path", label: "Discover your path" },
      { href: "/explore-courses", label: "I know what I want" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/team", label: "Team" },
      { href: "/careers", label: "Careers" },
      { href: "/credibility", label: "Credibility" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/resources", label: "Hub" },
      { href: "/resources/tools", label: "Tools" },
      { href: "/insights", label: "Insights" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/accessibility", label: "Accessibility" },
    ],
  },
] as const;

export const TRACK_SLUGS = ["ui-ux-design", "data-analytics", "software-dev", "career-accelerator"] as const;
