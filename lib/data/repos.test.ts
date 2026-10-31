import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, findUnique } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: {
    catalogueItem: { findMany, findUnique },
    meta: { findUnique: vi.fn() },
  },
}));

import { CatalogueRepo } from "./repos";

describe("CatalogueRepo public filtering", () => {
  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([]);
    findUnique.mockReset().mockResolvedValue(null);
  });

  it("lists only published items that do not need editorial review", async () => {
    await CatalogueRepo.list();

    expect(findMany).toHaveBeenCalledWith({
      where: {
        status: "published",
        needsEditorialReview: false,
      },
      include: {
        audiences: true,
        intents: true,
      },
      orderBy: { name: "asc" },
    });
  });

  it("preserves public filters when listing by type", async () => {
    await CatalogueRepo.list({ type: "course" });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        status: "published",
        needsEditorialReview: false,
        type: "course",
      },
      include: {
        audiences: true,
        intents: true,
      },
      orderBy: { name: "asc" },
    });
  });

  it("queries recommendation candidates using only publishable items", async () => {
    await CatalogueRepo.getRecommendationCandidates(["COURSE-001"]);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          itemId: { in: ["COURSE-001"] },
          status: "published",
          needsEditorialReview: false,
        },
      }),
    );
  });

  it.each([
    { status: "draft", needsEditorialReview: false },
    { status: "archived", needsEditorialReview: false },
    { status: "closed", needsEditorialReview: false },
    { status: "published", needsEditorialReview: true },
  ])("hides non-public catalogue items: $status, review=$needsEditorialReview", async (state) => {
    findUnique.mockResolvedValue({
      slug: "example-item",
      status: state.status,
      needsEditorialReview: state.needsEditorialReview,
    });

    await expect(CatalogueRepo.getBySlug("example-item")).resolves.toBeNull();
  });

  it("returns a published item that does not need editorial review", async () => {
    const item = {
      slug: "example-item",
      status: "published",
      needsEditorialReview: false,
    };
    findUnique.mockResolvedValue(item);

    await expect(CatalogueRepo.getBySlug("example-item")).resolves.toEqual(item);
  });
});
