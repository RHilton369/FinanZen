import { prisma } from './utils/prisma';

async function main() {
  const dummyUserId = "00000000-0000-0000-0000-000000000000";
  const dummyBranchId = "00000000-0000-0000-0000-000000000000";

  // Create User
  const user = await prisma.user.upsert({
    where: { id: dummyUserId },
    update: {},
    create: {
      id: dummyUserId,
      phone: "+550000000000",
      name: "Admin Dummy",
      isActive: true,
    },
  });

  // Create Branch
  const branch = await prisma.branch.upsert({
    where: { id: dummyBranchId },
    update: {},
    create: {
      id: dummyBranchId,
      name: "Filial Principal",
      userId: user.id,
    },
  });

  console.log("Seed concluído. Usuário e Filial dummy criados:", { user: user.id, branch: branch.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
