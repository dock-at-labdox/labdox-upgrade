import type { PrismaClient } from "@prisma/client";

const ROLES = [
  { slug: "approver", label: "Approver" },
  { slug: "editor", label: "Editor" },
  { slug: "sales", label: "Sales" },
] as const;

export async function seedRoles(prisma: PrismaClient) {
  for (const role of ROLES) {
    await prisma.staffRole.upsert({
      where: { slug: role.slug },
      update: { label: role.label },
      create: role,
    });
  }

  await prisma.staffUser.upsert({
    where: { email: "amit@labdox.local" },
    update: { name: "Amit Kothari", role: "approver" },
    create: { email: "amit@labdox.local", name: "Amit Kothari", role: "approver" },
  });
}
