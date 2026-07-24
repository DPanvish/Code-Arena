import { notFound } from "next/navigation";
import { prisma } from "../../../../../packages/db/index";
import ProblemWorkspace from "./ProblemWorkspace";

interface ProblemPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function DynamicProblemPage({ params }: ProblemPageProps) {
  const { slug } = await params;

  const problem = await prisma.problem.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      difficulty: true,
      tags: true,
    },
  });

  if (!problem) {
    notFound();
  }

  return (
    <main className="h-screen bg-[#09090b] pt-24 px-8 pb-8 flex flex-col">
      <ProblemWorkspace problem={problem} />
    </main>
  );
}