import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://labdox.com";
  const paths = [
    "/",
    "/discover-your-path",
    "/explore-courses",
    "/courses",
    "/services",
    "/organizations",
    "/about",
    "/about/labdox-journey",
    "/about/conglomerate-journey",
    "/credibility",
    "/credibility/accolades",
    "/team",
    "/careers",
    "/resources",
    "/resources/tools",
    "/insights",
    "/contact",
    "/privacy",
    "/terms",
    "/accessibility",
    "/tracks/ui-ux-design",
    "/tracks/data-analytics",
    "/tracks/software-dev",
    "/tracks/career-accelerator",
  ];
  return paths.map((path) => ({ url: `${base}${path}` }));
}
